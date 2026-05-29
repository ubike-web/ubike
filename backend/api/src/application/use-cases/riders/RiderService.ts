import { getSupabaseClient } from '../../../config/supabase';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { zegoService } from '../../../infrastructure/services/ZegoService';
import { socketGateway } from '../../../infrastructure/realtime/SocketGateway';
import { RiderProfile } from '../../../domain/entities/User';
import { ValidationError, ForbiddenError, NotFoundError } from '../../../shared/errors';
import { env } from '../../../config/env';

export class RiderService {
  private get db() { return getSupabaseClient(); }

  async toggleAvailability(riderId: string, available: boolean): Promise<RiderProfile> {
    const profile = await userRepository.findRiderProfile(riderId);
    if (!profile) throw new NotFoundError('Rider profile');
    if (!profile.is_kyc_verified) throw new ForbiddenError('KYC verification required before going online');

    return userRepository.updateRiderProfile(riderId, { is_available: available });
  }

  async updateLocation(riderId: string, lat: number, lng: number): Promise<void> {
    await userRepository.updateRiderLocation(riderId, lat, lng);
    // Realtime push to any active rides
    socketGateway.emitToAll(`rider:location:${riderId}`, { lat, lng, timestamp: Date.now() });
  }

  async submitKyc(riderId: string, data: {
    plateNumber: string;
    licenseUrl: string;
    nationalIdUrl: string;
    vehiclePhotoUrl: string;
    insuranceUrl?: string;
  }): Promise<void> {
    await this.db.from('kyc_documents').upsert({
      user_id: riderId,
      plate_number: data.plateNumber,
      license_url: data.licenseUrl,
      national_id_url: data.nationalIdUrl,
      vehicle_photo_url: data.vehiclePhotoUrl,
      insurance_url: data.insuranceUrl,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
  }

  async getEarnings(riderId: string) {
    const profile = await userRepository.findRiderProfile(riderId);
    if (!profile) throw new NotFoundError('Rider profile');

    const { data: recentRides } = await this.db
      .from('rides')
      .select('fare_final, completed_at')
      .eq('rider_id', riderId)
      .eq('status', 'completed')
      .eq('payment_status', 'released')
      .order('completed_at', { ascending: false })
      .limit(30);

    const { data: recentErrands } = await this.db
      .from('errands')
      .select('fare_final, completed_at')
      .eq('rider_id', riderId)
      .eq('status', 'delivered')
      .eq('payment_status', 'released')
      .order('completed_at', { ascending: false })
      .limit(30);

    return {
      totalEarnings: profile.earnings_total,
      pendingEarnings: profile.earnings_pending,
      totalRides: profile.total_rides,
      rating: profile.rating,
      recentRides: recentRides || [],
      recentErrands: recentErrands || [],
    };
  }

  async generateCallToken(riderId: string, rideId: string): Promise<{ token: string; roomId: string; appId: string }> {
    const roomId = zegoService.generateRoomId(rideId);
    const token = zegoService.generateToken(riderId, roomId);
    return { token, roomId, appId: env.ZEGO_APP_ID };
  }

  async getPerformanceStats(riderId: string) {
    const { data: rides } = await this.db
      .from('rides')
      .select('status, rating_by_customer')
      .eq('rider_id', riderId);

    const { data: errands } = await this.db
      .from('errands')
      .select('status, rating_by_customer')
      .eq('rider_id', riderId);

    const allCompleted = [
      ...(rides || []).filter(r => r.status === 'completed'),
      ...(errands || []).filter(e => e.status === 'delivered'),
    ];
    const rated = allCompleted.filter(r => r.rating_by_customer != null);
    const avgRating = rated.length > 0
      ? rated.reduce((sum, r) => sum + r.rating_by_customer, 0) / rated.length
      : 0;

    return {
      completedRides: (rides || []).filter(r => r.status === 'completed').length,
      completedErrands: (errands || []).filter(e => e.status === 'delivered').length,
      cancelledRides: (rides || []).filter(r => r.status === 'cancelled').length,
      averageRating: +avgRating.toFixed(2),
    };
  }
}

export const riderService = new RiderService();
