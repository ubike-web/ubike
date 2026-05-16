import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRideDto, UpdateRideStatusDto, RateRideDto, ScheduleRideDto } from './dto/rides.dto';
import { RideStatus } from '../../common/enums/user-role.enum';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    private supabase: SupabaseService,
    private matching: MatchingService,
    private notifications: NotificationsService,
  ) {}

  async requestRide(customerId: string, dto: CreateRideDto) {
    // Validate customer has no active ride
    const { data: activeRide } = await this.supabase
      .from('rides')
      .select('id')
      .eq('customer_id', customerId)
      .in('status', [RideStatus.PENDING, RideStatus.SEARCHING, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS])
      .single();

    if (activeRide) throw new BadRequestException('You already have an active ride');

    // Create ride record
    const { data: ride, error } = await this.supabase
      .from('rides')
      .insert({
        customer_id: customerId,
        pickup_address: dto.pickupAddress,
        pickup_lat: dto.pickupLat,
        pickup_lng: dto.pickupLng,
        destination_address: dto.destinationAddress,
        destination_lat: dto.destinationLat,
        destination_lng: dto.destinationLng,
        vehicle_type: dto.vehicleType,
        estimated_fare: dto.estimatedFare,
        distance_km: dto.distanceKm,
        status: RideStatus.SEARCHING,
        note: dto.note || null,
        scheduled_for: dto.scheduledFor || null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Find & notify nearby riders asynchronously
    this.matching.findAndNotifyRiders(ride.id, {
      lat: dto.pickupLat,
      lng: dto.pickupLng,
      vehicleType: dto.vehicleType,
      serviceType: 'transport',
    }).catch((e) => this.logger.error('Matching error', e));

    return ride;
  }

  async getRide(rideId: string) {
    const { data, error } = await this.supabase
      .from('rides')
      .select(`
        *,
        customers:customer_id(users(id, full_name, avatar_url, phone)),
        riders:rider_id(id, users(id, full_name, avatar_url), vehicles(*), rating)
      `)
      .eq('id', rideId)
      .single();

    if (error || !data) throw new NotFoundException('Ride not found');
    return data;
  }

  async acceptRide(riderId: string, rideId: string) {
    const { data: ride } = await this.supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== RideStatus.SEARCHING) {
      throw new BadRequestException('Ride is no longer available');
    }

    // Get rider record
    const { data: rider } = await this.supabase
      .from('riders')
      .select('id, user_id')
      .eq('user_id', riderId)
      .single();

    if (!rider) throw new NotFoundException('Rider not found');

    const { data: updated } = await this.supabase
      .from('rides')
      .update({
        rider_id: rider.id,
        status: RideStatus.ACCEPTED,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('status', RideStatus.SEARCHING) // Optimistic concurrency — only update if still searching
      .select()
      .single();

    if (!updated) throw new BadRequestException('Ride already accepted by another rider');

    // Notify customer
    await this.notifications.notifyRideAccepted(ride.customer_id, rideId, rider.id);

    return updated;
  }

  async updateStatus(riderId: string, rideId: string, dto: UpdateRideStatusDto) {
    const { data: ride } = await this.supabase
      .from('rides')
      .select('*, riders!inner(user_id)')
      .eq('id', rideId)
      .single();

    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.riders?.user_id !== riderId) throw new ForbiddenException('Not your ride');

    const validTransitions: Record<string, string[]> = {
      [RideStatus.ACCEPTED]: [RideStatus.RIDER_ARRIVING, RideStatus.CANCELLED],
      [RideStatus.RIDER_ARRIVING]: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
      [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED],
    };

    if (!validTransitions[ride.status]?.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${ride.status} to ${dto.status}`);
    }

    const updates: any = { status: dto.status };
    if (dto.status === RideStatus.IN_PROGRESS) updates.started_at = new Date().toISOString();
    if (dto.status === RideStatus.COMPLETED) {
      updates.completed_at = new Date().toISOString();
      updates.actual_fare = ride.estimated_fare;
    }
    if (dto.status === RideStatus.CANCELLED) {
      updates.cancelled_at = new Date().toISOString();
      updates.cancel_reason = dto.cancelReason;
    }

    const { data: updated } = await this.supabase
      .from('rides')
      .update(updates)
      .eq('id', rideId)
      .select()
      .single();

    // Notify customer of status change
    await this.notifications.notifyRideStatusChange(ride.customer_id, rideId, dto.status);

    // If completed — trigger payment processing
    if (dto.status === RideStatus.COMPLETED) {
      await this.processRideCompletion(ride);
    }

    return updated;
  }

  async cancelRide(customerId: string, rideId: string, reason?: string) {
    const { data: ride } = await this.supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('customer_id', customerId)
      .single();

    if (!ride) throw new NotFoundException('Ride not found');
    if (![RideStatus.PENDING, RideStatus.SEARCHING, RideStatus.ACCEPTED].includes(ride.status as RideStatus)) {
      throw new BadRequestException('Cannot cancel ride at this stage');
    }

    await this.supabase
      .from('rides')
      .update({
        status: RideStatus.CANCELLED,
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || 'Customer cancelled',
      })
      .eq('id', rideId);

    if (ride.rider_id) {
      await this.notifications.notifyRiderRideCancelled(ride.rider_id, rideId);
    }

    return { message: 'Ride cancelled' };
  }

  async rateRide(customerId: string, rideId: string, dto: RateRideDto) {
    const { data: ride } = await this.supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('customer_id', customerId)
      .eq('status', RideStatus.COMPLETED)
      .single();

    if (!ride) throw new NotFoundException('Ride not found or not yet completed');
    if (ride.is_rated) throw new BadRequestException('Ride already rated');

    await Promise.all([
      this.supabase.from('reviews').insert({
        ride_id: rideId,
        reviewer_id: customerId,
        reviewee_id: ride.rider_id,
        rating: dto.rating,
        comment: dto.comment,
        reviewer_type: 'customer',
      }),
      this.supabase.from('rides').update({ is_rated: true }).eq('id', rideId),
      this.updateRiderRating(ride.rider_id),
    ]);

    return { message: 'Rating submitted' };
  }

  async scheduleRide(customerId: string, dto: ScheduleRideDto) {
    const scheduledFor = new Date(dto.scheduledFor);
    if (scheduledFor <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    return this.requestRide(customerId, { ...dto, scheduledFor: dto.scheduledFor });
  }

  async getFareEstimate(pickupLat: number, pickupLng: number, destLat: number, destLng: number, vehicleType: string) {
    const R = 6371;
    const dLat = this.toRad(destLat - pickupLat);
    const dLng = this.toRad(destLng - pickupLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(pickupLat)) * Math.cos(this.toRad(destLat)) * Math.sin(dLng / 2) ** 2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const BASE = 100;
    const KM_RATE = 50;
    const ELECTRIC_SURCHARGE = 1.2;

    let fare = BASE + distanceKm * KM_RATE;
    if (vehicleType === 'electric_bike') fare *= ELECTRIC_SURCHARGE;

    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      estimatedFare: Math.round(fare),
      currency: 'KES',
    };
  }

  private async processRideCompletion(ride: any) {
    const commission = Math.round(ride.estimated_fare * 0.2);
    const riderEarning = ride.estimated_fare - commission;

    await Promise.all([
      // Deduct from customer wallet
      this.supabase.rpc('deduct_wallet', { p_user_id: ride.customer_id, p_amount: ride.estimated_fare }),
      // Credit rider wallet
      this.supabase.rpc('credit_wallet', { p_user_id: ride.rider_id, p_amount: riderEarning }),
      // Log transaction
      this.supabase.from('wallet_transactions').insert([
        { user_id: ride.customer_id, type: 'ride_payment', amount: -ride.estimated_fare, reference_id: ride.id },
        { user_id: ride.rider_id, type: 'earning', amount: riderEarning, reference_id: ride.id },
      ]),
      // Update rider trip count
      this.supabase.rpc('increment_rider_trips', { p_rider_id: ride.rider_id }),
    ]);
  }

  private async updateRiderRating(riderId: string) {
    const { data: reviews } = await this.supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', riderId);

    if (!reviews?.length) return;
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await this.supabase
      .from('riders')
      .update({ rating: Math.round(avg * 10) / 10 })
      .eq('id', riderId);
  }

  private toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }
}
