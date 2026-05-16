import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../../database/supabase.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MatchingService } from '../matching/matching.service';
import {
  UpdateRiderVerificationDto,
  SuspendUserDto,
  ProcessWithdrawalDto,
  UpdatePricingDto,
} from './dto/admin.dto';
import { VerificationStatus } from '../../common/enums/user-role.enum';

@Injectable()
export class AdminService {
  constructor(
    private supabase: SupabaseService,
    private payments: PaymentsService,
    private notifications: NotificationsService,
    private matching: MatchingService,
  ) {}

  // ─────────────────────────────────────────
  // User & Rider Management
  // ─────────────────────────────────────────
  async getAllUsers(role?: string, limit = 50, offset = 0) {
    let query = this.supabase
      .from('users')
      .select('id, full_name, phone, email, role, is_active, is_phone_verified, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) query = query.eq('role', role);
    const { data } = await query;
    return data ?? [];
  }

  async getPendingRiders(serviceType?: string) {
    let query = this.supabase
      .from('riders')
      .select(`
        id, service_type, verification_status, created_at,
        users(full_name, phone, email),
        vehicles(*),
        rider_documents(*)
      `)
      .eq('verification_status', VerificationStatus.PENDING);

    if (serviceType) query = query.eq('service_type', serviceType);
    const { data } = await query;
    return data ?? [];
  }

  async verifyRider(riderId: string, dto: UpdateRiderVerificationDto, adminId: string) {
    const { data: rider } = await this.supabase
      .from('riders')
      .select('*, users(phone, full_name)')
      .eq('id', riderId)
      .single();

    if (!rider) throw new NotFoundException('Rider not found');

    await this.supabase
      .from('riders')
      .update({ verification_status: dto.status, rejection_reason: dto.reason || null })
      .eq('id', riderId);

    // Log admin action
    await this.supabase.from('admin_actions').insert({
      admin_id: adminId,
      action_type: 'rider_verification',
      target_id: riderId,
      details: { status: dto.status, reason: dto.reason },
    });

    // Notify rider
    const message =
      dto.status === VerificationStatus.VERIFIED
        ? 'Congratulations! Your u-bike rider account has been verified. You can now go online.'
        : `Your u-bike rider application was ${dto.status}. Reason: ${dto.reason || 'See support.'}`;

    await this.notifications.sendPush((rider.users as any)?.user_id || rider.user_id, 'Account Update', message);

    return { message: `Rider ${dto.status}` };
  }

  async suspendUser(userId: string, dto: SuspendUserDto, adminId: string) {
    await this.supabase
      .from('users')
      .update({ is_active: !dto.suspend })
      .eq('id', userId);

    await this.supabase.from('admin_actions').insert({
      admin_id: adminId,
      action_type: dto.suspend ? 'suspend_user' : 'unsuspend_user',
      target_id: userId,
      details: { reason: dto.reason },
    });

    return { message: dto.suspend ? 'User suspended' : 'User unsuspended' };
  }

  // ─────────────────────────────────────────
  // Platform Analytics
  // ─────────────────────────────────────────
  async getPlatformStats() {
    const [users, riders, rides, errands, revenue] = await Promise.all([
      this.supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      this.supabase.from('riders').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      this.supabase.from('rides').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      this.supabase.from('errands').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
      this.supabase.from('wallet_transactions').select('amount').eq('type', 'ride_payment'),
    ]);

    const totalRevenue = (revenue.data ?? []).reduce((acc, t) => acc + Math.abs(Number(t.amount)) * 0.2, 0);

    return {
      totalCustomers: users.count ?? 0,
      totalRiders: riders.count ?? 0,
      completedRides: rides.count ?? 0,
      completedErrands: errands.count ?? 0,
      platformRevenue: Math.round(totalRevenue),
    };
  }

  async getActiveRides() {
    const { data } = await this.supabase
      .from('rides')
      .select(`
        id, status, created_at,
        customers:customer_id(users(full_name)),
        riders:rider_id(users(full_name), current_lat, current_lng)
      `)
      .in('status', ['searching', 'accepted', 'rider_arriving', 'in_progress']);
    return data ?? [];
  }

  async getActiveErrands() {
    const { data } = await this.supabase
      .from('errands')
      .select(`
        id, status, item_description, created_at,
        customers:customer_id(users(full_name)),
        riders:rider_id(users(full_name))
      `)
      .in('status', ['searching', 'accepted', 'picked_up', 'in_transit']);
    return data ?? [];
  }

  // ─────────────────────────────────────────
  // Financial Management
  // ─────────────────────────────────────────
  async getPendingWithdrawals() {
    const { data } = await this.supabase
      .from('withdrawals')
      .select('*, users(full_name, phone)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  async processWithdrawal(withdrawalId: string, dto: ProcessWithdrawalDto, adminId: string) {
    if (dto.action === 'approve') {
      await this.payments.initiateRiderPayout(withdrawalId);
    } else {
      const { data: withdrawal } = await this.supabase
        .from('withdrawals')
        .select('user_id, amount')
        .eq('id', withdrawalId)
        .single();

      if (!withdrawal) throw new NotFoundException('Withdrawal not found');

      await Promise.all([
        this.supabase.rpc('credit_wallet', { p_user_id: withdrawal.user_id, p_amount: withdrawal.amount }),
        this.supabase
          .from('withdrawals')
          .update({ status: 'rejected', rejection_reason: dto.reason })
          .eq('id', withdrawalId),
      ]);
    }

    await this.supabase.from('admin_actions').insert({
      admin_id: adminId,
      action_type: `withdrawal_${dto.action}`,
      target_id: withdrawalId,
      details: { reason: dto.reason },
    });

    return { message: `Withdrawal ${dto.action}d` };
  }

  // ─────────────────────────────────────────
  // Support Tickets
  // ─────────────────────────────────────────
  async getSupportTickets(status?: string) {
    let query = this.supabase
      .from('support_tickets')
      .select('*, users(full_name, phone)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    const { data } = await query;
    return data ?? [];
  }

  async resolveTicket(ticketId: string, resolution: string, adminId: string) {
    await this.supabase
      .from('support_tickets')
      .update({ status: 'resolved', resolution, resolved_by: adminId, resolved_at: new Date().toISOString() })
      .eq('id', ticketId);
    return { message: 'Ticket resolved' };
  }

  // ─────────────────────────────────────────
  // Platform Settings (Super Admin)
  // ─────────────────────────────────────────
  async getPlatformSettings() {
    const { data } = await this.supabase.from('platform_settings').select('*');
    return data ?? [];
  }

  async updatePricing(dto: UpdatePricingDto, adminId: string) {
    const updates = [
      { key: 'base_fare', value: dto.baseFare },
      { key: 'km_rate', value: dto.kmRate },
      { key: 'electric_surcharge', value: dto.electricSurcharge },
      { key: 'platform_commission', value: dto.commission },
    ].filter((u) => u.value !== undefined);

    for (const update of updates) {
      await this.supabase
        .from('platform_settings')
        .upsert({ key: update.key, value: String(update.value) });
    }

    await this.supabase.from('admin_actions').insert({
      admin_id: adminId,
      action_type: 'update_pricing',
      target_id: 'platform',
      details: dto,
    });

    return { message: 'Pricing updated' };
  }

  // ─────────────────────────────────────────
  // Cron Jobs
  // ─────────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendOfflineRiderReminders() {
    const thresholdHours = 24;
    const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString();

    const { data: offlineRiders } = await this.supabase
      .from('riders')
      .select('id, user_id, users(phone, full_name)')
      .eq('is_online', false)
      .eq('verification_status', 'verified')
      .lt('last_seen', threshold)
      .not('users.phone', 'is', null);

    if (!offlineRiders?.length) return;

    for (const rider of offlineRiders) {
      const user = (rider.users as any);
      await this.notifications.sendOfflineReminderSms(user.phone, user.full_name);
    }
  }

  @Cron('0 9 * * 1') // Every Monday at 9am
  async sendWeeklyEarningsSummary() {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const { data: riders } = await this.supabase
      .from('riders')
      .select('id, user_id, users(phone, full_name)')
      .eq('verification_status', 'verified');

    for (const rider of riders ?? []) {
      const { data: txns } = await this.supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', rider.user_id)
        .eq('type', 'earning')
        .gte('created_at', weekStart.toISOString());

      const total = (txns ?? []).reduce((acc, t) => acc + Number(t.amount), 0);
      const trips = txns?.length ?? 0;

      if (trips > 0) {
        const user = (rider.users as any);
        await this.notifications.sendEarningSummarySms(user.phone, user.full_name, total, trips);
      }
    }
  }
}
