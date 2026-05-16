import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { OtpService } from '../otp/otp.service';

// No Firebase. Notifications use:
//  1. Socket.IO (real-time push to connected clients)  — via RealtimeGateway
//  2. Supabase Realtime (mobile app subscribes to DB changes)
//  3. Africa's Talking SMS (for critical alerts + offline riders)

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Late-injected to avoid circular dependency with RealtimeModule
  private realtimeGateway: any;

  constructor(
    private supabase: SupabaseService,
    private otp: OtpService,
  ) {}

  setRealtimeGateway(gateway: any) {
    this.realtimeGateway = gateway;
  }

  // ─────────────────────────────────────────
  // Save notification to DB (Supabase Realtime picks it up on client)
  // ─────────────────────────────────────────
  async saveNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    referenceId?: string,
  ) {
    const { data } = await this.supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        type,
        reference_id: referenceId || null,
        is_read: false,
      })
      .select()
      .single();

    // Also push over Socket.IO if user is connected
    if (this.realtimeGateway) {
      this.realtimeGateway.emitToUser(userId, 'notification:new', {
        id: data?.id,
        title,
        body,
        type,
        referenceId,
        createdAt: new Date().toISOString(),
      });
    }

    return data;
  }

  async getUserNotifications(userId: string, limit = 30, offset = 0) {
    const { data } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return data ?? [];
  }

  async markNotificationsRead(userId: string, notificationIds: string[]) {
    await this.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('user_id', userId);
    return { updated: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count ?? 0;
  }

  // ─────────────────────────────────────────
  // Domain notification helpers
  // (save to DB → Supabase Realtime → Socket.IO socket push)
  // ─────────────────────────────────────────

  async notifyRideAccepted(customerId: string, rideId: string, riderId: string) {
    await this.saveNotification(
      customerId,
      'Rider Found!',
      'Your rider is on the way. Track them on the map.',
      'ride_accepted',
      rideId,
    );
  }

  async notifyRideStatusChange(customerId: string, rideId: string, status: string) {
    const messages: Record<string, { title: string; body: string }> = {
      rider_arriving: { title: 'Rider Arriving', body: 'Your rider is arriving now' },
      in_progress:    { title: 'Ride Started', body: 'Your ride is in progress. Enjoy!' },
      completed:      { title: 'Ride Completed', body: 'You have arrived. Please rate your experience.' },
      cancelled:      { title: 'Ride Cancelled', body: 'Your ride was cancelled.' },
    };
    const { title, body } = messages[status] ?? { title: 'Ride Update', body: `Status: ${status}` };
    await this.saveNotification(customerId, title, body, 'ride_status', rideId);
  }

  async notifyRiderRideCancelled(riderId: string, rideId: string) {
    // Get rider's user_id
    const { data: rider } = await this.supabase
      .from('riders')
      .select('user_id')
      .eq('id', riderId)
      .single();
    if (!rider) return;

    await this.saveNotification(
      rider.user_id,
      'Ride Cancelled',
      'The customer cancelled this ride. Stay online for the next request.',
      'ride_cancelled',
      rideId,
    );
  }

  async notifyErrandAccepted(customerId: string, errandId: string, riderId: string) {
    await this.saveNotification(
      customerId,
      'Rider Assigned!',
      'An errands rider is handling your request.',
      'errand_accepted',
      errandId,
    );
  }

  async notifyErrandStatusChange(customerId: string, errandId: string, status: string) {
    const messages: Record<string, { title: string; body: string }> = {
      picked_up:  { title: 'Item Picked Up', body: 'Your item has been collected by the rider.' },
      in_transit: { title: 'On the Way', body: 'Your delivery is in transit.' },
      delivered:  { title: 'Delivered!', body: 'Your errand has been delivered. Please rate your experience.' },
    };
    const { title, body } = messages[status] ?? { title: 'Errand Update', body: `Status: ${status}` };
    await this.saveNotification(customerId, title, body, 'errand_status', errandId);
  }

  // ─────────────────────────────────────────
  // SMS notifications (Africa's Talking)
  // Used for: OTP, offline reminders, weekly summaries, security alerts
  // ─────────────────────────────────────────

  async sendOfflineReminderSms(riderPhone: string, riderName: string) {
    const message = `Hi ${riderName}! You've been offline for a while on u-bike. Go online now to receive ride requests and earn more. 🏍️`;
    await this.otp.sendSms(riderPhone, message);
    this.logger.log(`Offline reminder sent to ${riderName}`);
  }

  async sendEarningSummarySms(riderPhone: string, riderName: string, amount: number, trips: number) {
    const message = `u-bike Weekly Earnings for ${riderName}: KES ${amount.toLocaleString()} from ${trips} trip${trips === 1 ? '' : 's'}. Keep going! 💰 Log in to withdraw.`;
    await this.otp.sendSms(riderPhone, message);
  }

  async sendRideRequestSms(riderPhone: string, pickup: string) {
    const message = `New u-bike ride request near ${pickup}. Open the app to accept!`;
    await this.otp.sendSms(riderPhone, message);
  }

  async sendSecurityAlertSms(phone: string) {
    const message = `u-bike Security Alert: A new login was detected on your account. If this wasn't you, contact support immediately.`;
    await this.otp.sendSms(phone, message);
  }

  async sendWithdrawalConfirmationSms(phone: string, amount: number) {
    const message = `u-bike: Your withdrawal request of KES ${amount.toLocaleString()} has been received and is being processed. You'll receive it within 24 hours.`;
    await this.otp.sendSms(phone, message);
  }
}
