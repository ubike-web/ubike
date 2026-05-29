import { errandRepository } from '../../../infrastructure/repositories/ErrandRepository';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { mapsService } from '../../../infrastructure/services/MapsService';
import { socketGateway } from '../../../infrastructure/realtime/SocketGateway';
import { Errand, ErrandRequest } from '../../../domain/entities/Errand';
import { ForbiddenError, ValidationError } from '../../../shared/errors';
import { env } from '../../../config/env';

export class ErrandService {
  async requestErrand(customerId: string, request: ErrandRequest): Promise<Errand> {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = request;

    const route = await mapsService.getRoute(
      { lat: pickup_lat, lng: pickup_lng },
      { lat: dropoff_lat, lng: dropoff_lng },
    );

    const fareEstimate = env.ERRAND_BASE_FARE_KES + route.distanceKm * env.KM_RATE_KES;

    const errand = await errandRepository.create({
      customer_id: customerId,
      category: request.category,
      description: request.description,
      pickup_address: request.pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address: request.dropoff_address,
      dropoff_lat,
      dropoff_lng,
      distance_km: route.distanceKm,
      status: 'requested',
      fare_estimate: Math.ceil(fareEstimate),
      payment_status: 'pending',
      item_value: request.item_value,
      item_description: request.item_description,
      recipient_name: request.recipient_name,
      recipient_phone: request.recipient_phone,
      scheduled_at: request.scheduled_at,
    });

    // Broadcast to nearby errands riders
    const riders = await userRepository.findAvailableRiders(pickup_lat, pickup_lng, env.RIDER_MATCH_RADIUS_KM, 'errands');
    for (const rider of riders) {
      socketGateway.emitToUser(rider.user_id, 'errand:new_request', {
        errandId: errand.id,
        category: errand.category,
        pickupAddress: errand.pickup_address,
        dropoffAddress: errand.dropoff_address,
        fareEstimate: errand.fare_estimate,
        distanceKm: route.distanceKm,
      });
    }

    setTimeout(async () => {
      const current = await errandRepository.findById(errand.id);
      if (current.status === 'requested') {
        await errandRepository.updateStatus(errand.id, 'cancelled', { cancellation_reason: 'No rider found' });
        socketGateway.emitToUser(customerId, 'errand:cancelled', { errandId: errand.id, reason: 'No rider found' });
      }
    }, env.RIDER_REQUEST_TIMEOUT_SECONDS * 1000);

    return errand;
  }

  async acceptErrand(riderId: string, errandId: string): Promise<Errand> {
    const errand = await errandRepository.findById(errandId);
    if (errand.status !== 'requested') throw new ValidationError('Errand is no longer available');

    const updated = await errandRepository.updateStatus(errandId, 'accepted', {
      rider_id: riderId,
      accepted_at: new Date().toISOString(),
    });

    socketGateway.emitToUser(errand.customer_id, 'errand:accepted', { errandId, riderId });
    return updated;
  }

  async pickupErrand(riderId: string, errandId: string): Promise<Errand> {
    const errand = await errandRepository.findById(errandId);
    if (errand.rider_id !== riderId) throw new ForbiddenError();
    if (errand.status !== 'accepted') throw new ValidationError('Invalid errand status');

    const updated = await errandRepository.updateStatus(errandId, 'picked_up');
    socketGateway.emitToUser(errand.customer_id, 'errand:picked_up', { errandId });
    return updated;
  }

  async startTransit(riderId: string, errandId: string): Promise<Errand> {
    const errand = await errandRepository.findById(errandId);
    if (errand.rider_id !== riderId) throw new ForbiddenError();
    if (errand.status !== 'picked_up') throw new ValidationError('Item must be picked up first');

    const updated = await errandRepository.updateStatus(errandId, 'in_transit');
    socketGateway.emitToUser(errand.customer_id, 'errand:in_transit', { errandId });
    return updated;
  }

  async completeErrand(riderId: string, errandId: string, proofUrl?: string): Promise<Errand> {
    const errand = await errandRepository.findById(errandId);
    if (errand.rider_id !== riderId) throw new ForbiddenError();
    if (errand.status !== 'in_transit') throw new ValidationError('Errand is not in transit');

    const fareFinal = errand.fare_final || errand.fare_estimate;
    const commission = fareFinal * env.PLATFORM_COMMISSION_STANDARD;
    const riderEarnings = fareFinal - commission;

    const updated = await errandRepository.updateStatus(errandId, 'delivered', {
      fare_final: fareFinal,
      payment_status: 'released',
      proof_of_delivery_url: proofUrl,
      completed_at: new Date().toISOString(),
    });

    await userRepository.updateRiderProfile(riderId, {
      earnings_total: (await userRepository.findRiderProfile(riderId))!.earnings_total + riderEarnings,
    });

    socketGateway.emitToUser(errand.customer_id, 'errand:delivered', { errandId, fareFinal, riderEarnings });
    return updated;
  }

  async cancelErrand(userId: string, errandId: string, reason: string): Promise<Errand> {
    const errand = await errandRepository.findById(errandId);
    const isCustomer = errand.customer_id === userId;
    const isRider = errand.rider_id === userId;

    if (!isCustomer && !isRider) throw new ForbiddenError();
    if (['delivered', 'cancelled'].includes(errand.status)) throw new ValidationError('Cannot cancel');

    const updated = await errandRepository.updateStatus(errandId, 'cancelled', { cancellation_reason: reason });

    if (isCustomer && errand.rider_id) {
      socketGateway.emitToUser(errand.rider_id, 'errand:cancelled', { errandId, reason });
    }
    if (isRider) {
      socketGateway.emitToUser(errand.customer_id, 'errand:cancelled', { errandId, reason });
    }

    return updated;
  }
}

export const errandService = new ErrandService();
