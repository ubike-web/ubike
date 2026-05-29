import { v4 as uuid } from 'uuid';
import { rideRepository } from '../../../infrastructure/repositories/RideRepository';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { mapsService } from '../../../infrastructure/services/MapsService';
import { socketGateway } from '../../../infrastructure/realtime/SocketGateway';
import { Ride, RideRequest } from '../../../domain/entities/Ride';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/errors';
import { env } from '../../../config/env';

export class RideService {
  async requestRide(customerId: string, request: RideRequest): Promise<Ride> {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = request;

    const route = await mapsService.getRoute(
      { lat: pickup_lat, lng: pickup_lng },
      { lat: dropoff_lat, lng: dropoff_lng },
    );
    const fareEstimate = mapsService.estimateFare(route, 1, request.vehicle_type);

    const ride = await rideRepository.create({
      customer_id: customerId,
      pickup_address: request.pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address: request.dropoff_address,
      dropoff_lat,
      dropoff_lng,
      distance_km: route.distanceKm,
      duration_minutes: route.durationMinutes,
      status: 'requested',
      fare_estimate: fareEstimate.totalFare,
      payment_status: 'pending',
      vehicle_type: request.vehicle_type,
      surge_multiplier: 1,
      sos_triggered: false,
      scheduled_at: request.scheduled_at,
    });

    // Broadcast to nearby riders
    const riders = await userRepository.findAvailableRiders(pickup_lat, pickup_lng, env.RIDER_MATCH_RADIUS_KM, 'passenger');
    for (const rider of riders) {
      socketGateway.emitToUser(rider.user_id, 'ride:new_request', {
        rideId: ride.id,
        pickupAddress: request.pickup_address,
        dropoffAddress: request.dropoff_address,
        distanceKm: route.distanceKm,
        fareEstimate: fareEstimate.totalFare,
        vehicleType: request.vehicle_type,
      });
    }

    // Auto-cancel if no rider accepts within timeout
    setTimeout(async () => {
      const current = await rideRepository.findById(ride.id);
      if (current.status === 'requested') {
        await rideRepository.updateStatus(ride.id, 'cancelled', { cancellation_reason: 'No rider found' });
        socketGateway.emitToUser(customerId, 'ride:cancelled', { rideId: ride.id, reason: 'No rider found' });
      }
    }, env.RIDER_REQUEST_TIMEOUT_SECONDS * 1000);

    return ride;
  }

  async acceptRide(riderId: string, rideId: string): Promise<Ride> {
    const ride = await rideRepository.findById(rideId);
    if (ride.status !== 'requested') throw new ValidationError('Ride is no longer available');

    const activeRide = await rideRepository.findActiveByRider(riderId);
    if (activeRide) throw new ValidationError('You already have an active ride');

    const updated = await rideRepository.updateStatus(rideId, 'accepted', {
      rider_id: riderId,
      accepted_at: new Date().toISOString(),
    });

    const riderProfile = await userRepository.findRiderProfile(riderId);
    socketGateway.emitToUser(ride.customer_id, 'ride:accepted', {
      rideId,
      riderId,
      riderProfile,
    });

    return updated;
  }

  async riderArrived(riderId: string, rideId: string): Promise<Ride> {
    const ride = await rideRepository.findById(rideId);
    if (ride.rider_id !== riderId) throw new ForbiddenError();
    if (ride.status !== 'accepted') throw new ValidationError('Invalid ride status');

    const updated = await rideRepository.updateStatus(rideId, 'rider_arrived');
    socketGateway.emitToUser(ride.customer_id, 'ride:rider_arrived', { rideId });
    return updated;
  }

  async startRide(riderId: string, rideId: string): Promise<Ride> {
    const ride = await rideRepository.findById(rideId);
    if (ride.rider_id !== riderId) throw new ForbiddenError();
    if (ride.status !== 'rider_arrived') throw new ValidationError('Customer must be picked up first');

    const updated = await rideRepository.updateStatus(rideId, 'in_progress');
    socketGateway.emitToUser(ride.customer_id, 'ride:started', { rideId });
    return updated;
  }

  async completeRide(riderId: string, rideId: string): Promise<Ride> {
    const ride = await rideRepository.findById(rideId);
    if (ride.rider_id !== riderId) throw new ForbiddenError();
    if (ride.status !== 'in_progress') throw new ValidationError('Ride is not in progress');

    const fareFinal = ride.fare_final || ride.fare_estimate;
    const commission = fareFinal * env.PLATFORM_COMMISSION_STANDARD;
    const riderEarnings = fareFinal - commission;

    const updated = await rideRepository.updateStatus(rideId, 'completed', {
      fare_final: fareFinal,
      payment_status: 'released',
      completed_at: new Date().toISOString(),
    });

    // Update rider earnings
    await userRepository.updateRiderProfile(riderId, {
      earnings_total: (await userRepository.findRiderProfile(riderId))!.earnings_total + riderEarnings,
    });

    socketGateway.emitToUser(ride.customer_id, 'ride:completed', {
      rideId,
      fareFinal,
      riderEarnings,
    });

    return updated;
  }

  async cancelRide(userId: string, rideId: string, reason: string): Promise<Ride> {
    const ride = await rideRepository.findById(rideId);
    const isCustomer = ride.customer_id === userId;
    const isRider = ride.rider_id === userId;

    if (!isCustomer && !isRider) throw new ForbiddenError();
    if (['completed', 'cancelled'].includes(ride.status)) throw new ValidationError('Ride cannot be cancelled');

    const updated = await rideRepository.updateStatus(rideId, 'cancelled', { cancellation_reason: reason });

    if (isCustomer && ride.rider_id) {
      socketGateway.emitToUser(ride.rider_id, 'ride:cancelled', { rideId, reason });
    }
    if (isRider) {
      socketGateway.emitToUser(ride.customer_id, 'ride:cancelled', { rideId, reason });
    }

    return updated;
  }

  async proposeFareAdjustment(riderId: string, rideId: string, proposedFare: number): Promise<void> {
    const ride = await rideRepository.findById(rideId);
    if (ride.rider_id !== riderId) throw new ForbiddenError();

    const maxFare = ride.fare_estimate * (1 + env.MAX_FARE_RAISE_PERCENT / 100);
    if (proposedFare > maxFare) {
      throw new ValidationError(`Fare cannot exceed ${env.MAX_FARE_RAISE_PERCENT}% above estimate (max KES ${Math.ceil(maxFare)})`);
    }

    await rideRepository.update(rideId, { status: 'fare_negotiation' });
    socketGateway.emitToUser(ride.customer_id, 'ride:fare_proposed', {
      rideId,
      proposedFare,
      maxFare: Math.ceil(maxFare),
    });
  }

  async respondFareProposal(customerId: string, rideId: string, accepted: boolean, counterFare?: number): Promise<void> {
    const ride = await rideRepository.findById(rideId);
    if (ride.customer_id !== customerId) throw new ForbiddenError();
    if (ride.status !== 'fare_negotiation') throw new ValidationError('No fare negotiation in progress');

    if (accepted) {
      await rideRepository.update(rideId, { fare_customer_approved: true, status: 'accepted' });
      socketGateway.emitToUser(ride.rider_id!, 'ride:fare_accepted', { rideId });
    } else {
      await rideRepository.update(rideId, { status: 'accepted' });
      socketGateway.emitToUser(ride.rider_id!, 'ride:fare_rejected', { rideId, counterFare });
    }
  }

  async getFareEstimate(pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }, vehicleType: 'standard' | 'electric' = 'standard') {
    const route = await mapsService.getRoute(pickup, dropoff);
    return mapsService.estimateFare(route, 1, vehicleType);
  }

  async rateRide(userId: string, rideId: string, rating: number, role: 'customer' | 'rider'): Promise<void> {
    if (rating < 1 || rating > 5) throw new ValidationError('Rating must be between 1 and 5');
    const ride = await rideRepository.findById(rideId);
    if (ride.status !== 'completed') throw new ValidationError('Can only rate completed rides');

    if (role === 'customer') {
      if (ride.customer_id !== userId) throw new ForbiddenError();
      await rideRepository.update(rideId, { rating_by_customer: rating });
    } else {
      if (ride.rider_id !== userId) throw new ForbiddenError();
      await rideRepository.update(rideId, { rating_by_rider: rating });
    }
  }
}

export const rideService = new RideService();
