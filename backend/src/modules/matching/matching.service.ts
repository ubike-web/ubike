import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../database/supabase.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { RiderServiceType, VehicleType } from '../../common/enums/user-role.enum';

interface MatchParams {
  lat: number;
  lng: number;
  serviceType: 'transport' | 'errands';
  vehicleType?: VehicleType;
}

interface NearbyRider {
  id: string;
  user_id: string;
  current_lat: number;
  current_lng: number;
  rating: number;
  acceptance_rate: number;
  distanceKm: number;
  score: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly radiusKm: number;
  private readonly requestTimeoutSec: number;

  constructor(
    private supabase: SupabaseService,
    @Inject(forwardRef(() => RealtimeGateway)) private realtime: RealtimeGateway,
    private config: ConfigService,
  ) {
    this.radiusKm = config.get('RIDER_MATCH_RADIUS_KM', 5);
    this.requestTimeoutSec = config.get('RIDER_REQUEST_TIMEOUT_SECONDS', 30);
  }

  async findAndNotifyRiders(requestId: string, params: MatchParams): Promise<void> {
    const riders = await this.findNearbyRiders(params);

    if (riders.length === 0) {
      this.logger.warn(`No riders found for request ${requestId}`);
      await this.markRequestExpired(requestId, params.serviceType);
      return;
    }

    this.logger.log(`Found ${riders.length} nearby riders for request ${requestId}`);

    const riderIds = riders.map((r) => r.id);
    const requestData = await this.buildRequestPayload(requestId, params.serviceType);

    if (params.serviceType === 'transport') {
      this.realtime.emitRideRequest(riderIds, requestData);
    } else {
      this.realtime.emitErrandRequest(riderIds, requestData);
    }

    // Schedule timeout — if no acceptance within timeout, expire
    setTimeout(async () => {
      const table = params.serviceType === 'transport' ? 'rides' : 'errands';
      const statusField = params.serviceType === 'transport' ? 'status' : 'status';

      const { data } = await this.supabase
        .from(table)
        .select('status')
        .eq('id', requestId)
        .single();

      if (data?.status === 'searching') {
        await this.markRequestExpired(requestId, params.serviceType);
        this.logger.log(`Request ${requestId} expired — no rider accepted`);
      }
    }, this.requestTimeoutSec * 1000);
  }

  private async findNearbyRiders(params: MatchParams): Promise<NearbyRider[]> {
    const serviceType =
      params.serviceType === 'transport' ? RiderServiceType.TRANSPORT : RiderServiceType.ERRANDS;

    // Use Supabase PostGIS or Haversine via RPC for proper geo queries
    const { data: riders } = await this.supabase
      .rpc('find_nearby_riders', {
        p_lat: params.lat,
        p_lng: params.lng,
        p_radius_km: this.radiusKm,
        p_service_type: serviceType,
        p_vehicle_type: params.vehicleType || null,
      });

    if (!riders || riders.length === 0) return [];

    // Score and sort riders
    return riders
      .map((rider: any) => ({
        ...rider,
        score: this.calculateRiderScore(rider),
      }))
      .sort((a: NearbyRider, b: NearbyRider) => b.score - a.score)
      .slice(0, 10); // Notify top 10
  }

  private calculateRiderScore(rider: any): number {
    const distanceScore = Math.max(0, 1 - rider.distanceKm / this.radiusKm);
    const ratingScore = (rider.rating - 1) / 4; // Normalize 1-5 → 0-1
    const acceptanceScore = rider.acceptance_rate / 100;

    // Weighted composite score
    return distanceScore * 0.5 + ratingScore * 0.3 + acceptanceScore * 0.2;
  }

  private async buildRequestPayload(requestId: string, serviceType: string) {
    const table = serviceType === 'transport' ? 'rides' : 'errands';
    const { data } = await this.supabase
      .from(table)
      .select('*')
      .eq('id', requestId)
      .single();
    return { requestId, serviceType, ...data };
  }

  private async markRequestExpired(requestId: string, serviceType: string) {
    const table = serviceType === 'transport' ? 'rides' : 'errands';
    await this.supabase
      .from(table)
      .update({ status: 'expired' })
      .eq('id', requestId)
      .eq('status', 'searching');
  }

  // Heatmap — aggregate rider activity zones for admin dashboard
  async getHeatmapData(serviceType?: string) {
    const { data } = await this.supabase
      .from('riders')
      .select('current_lat, current_lng, is_online, service_type')
      .eq('is_online', true)
      .not('current_lat', 'is', null);

    return (data ?? [])
      .filter((r) => !serviceType || r.service_type === serviceType)
      .map((r) => ({ lat: r.current_lat, lng: r.current_lng }));
  }

  async getSurgeZones(): Promise<Array<{ lat: number; lng: number; multiplier: number }>> {
    const { data } = await this.supabase.rpc('get_surge_zones');
    return data ?? [];
  }
}
