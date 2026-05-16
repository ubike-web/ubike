import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateErrandDto, UpdateErrandStatusDto, RateErrandDto, UploadDeliveryProofDto,
} from './dto/errands.dto';
import { ErrandStatus } from '../../common/enums/user-role.enum';

@Injectable()
export class ErrandsService {
  private readonly logger = new Logger(ErrandsService.name);

  constructor(
    private supabase: SupabaseService,
    private matching: MatchingService,
    private notifications: NotificationsService,
  ) {}

  async createErrand(customerId: string, dto: CreateErrandDto) {
    const { data: active } = await this.supabase
      .from('errands')
      .select('id')
      .eq('customer_id', customerId)
      .in('status', [ErrandStatus.PENDING, ErrandStatus.SEARCHING, ErrandStatus.ACCEPTED, ErrandStatus.IN_TRANSIT])
      .single();

    if (active) throw new BadRequestException('You already have an active errand');

    const { data: errand, error } = await this.supabase
      .from('errands')
      .insert({
        customer_id: customerId,
        pickup_address: dto.pickupAddress,
        pickup_lat: dto.pickupLat,
        pickup_lng: dto.pickupLng,
        delivery_address: dto.deliveryAddress,
        delivery_lat: dto.deliveryLat,
        delivery_lng: dto.deliveryLng,
        item_description: dto.itemDescription,
        item_size: dto.itemSize,
        item_value: dto.itemValue || null,
        recipient_name: dto.recipientName || null,
        recipient_phone: dto.recipientPhone || null,
        note: dto.note || null,
        estimated_fare: dto.estimatedFare,
        distance_km: dto.distanceKm,
        status: ErrandStatus.SEARCHING,
        stops: dto.stops ? JSON.stringify(dto.stops) : null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Find & notify nearby errands riders
    this.matching.findAndNotifyRiders(errand.id, {
      lat: dto.pickupLat,
      lng: dto.pickupLng,
      serviceType: 'errands',
    }).catch((e) => this.logger.error('Errand matching error', e));

    return errand;
  }

  async getErrand(errandId: string) {
    const { data, error } = await this.supabase
      .from('errands')
      .select(`
        *,
        customers:customer_id(users(id, full_name, avatar_url)),
        riders:rider_id(id, users(id, full_name, avatar_url), vehicles(*), rating)
      `)
      .eq('id', errandId)
      .single();

    if (error || !data) throw new NotFoundException('Errand not found');
    return data;
  }

  async acceptErrand(riderUserId: string, errandId: string) {
    const { data: errand } = await this.supabase
      .from('errands')
      .select('*')
      .eq('id', errandId)
      .single();

    if (!errand) throw new NotFoundException('Errand not found');
    if (errand.status !== ErrandStatus.SEARCHING) throw new BadRequestException('Errand no longer available');

    const { data: rider } = await this.supabase
      .from('riders')
      .select('id, user_id')
      .eq('user_id', riderUserId)
      .single();

    if (!rider) throw new NotFoundException('Rider not found');

    const { data: updated } = await this.supabase
      .from('errands')
      .update({ rider_id: rider.id, status: ErrandStatus.ACCEPTED, accepted_at: new Date().toISOString() })
      .eq('id', errandId)
      .eq('status', ErrandStatus.SEARCHING)
      .select()
      .single();

    if (!updated) throw new BadRequestException('Errand already taken');

    await this.notifications.notifyErrandAccepted(errand.customer_id, errandId, rider.id);
    return updated;
  }

  async updateStatus(riderUserId: string, errandId: string, dto: UpdateErrandStatusDto) {
    const { data: errand } = await this.supabase
      .from('errands')
      .select('*, riders!inner(user_id)')
      .eq('id', errandId)
      .single();

    if (!errand) throw new NotFoundException('Errand not found');
    const ridersRow = Array.isArray(errand.riders) ? errand.riders[0] : errand.riders;
    if ((ridersRow as any)?.user_id !== riderUserId) throw new ForbiddenException('Not your errand');

    const validTransitions: Record<string, string[]> = {
      [ErrandStatus.ACCEPTED]: [ErrandStatus.PICKED_UP, ErrandStatus.CANCELLED],
      [ErrandStatus.PICKED_UP]: [ErrandStatus.IN_TRANSIT],
      [ErrandStatus.IN_TRANSIT]: [ErrandStatus.DELIVERED],
    };

    if (!validTransitions[errand.status]?.includes(dto.status)) {
      throw new BadRequestException(`Invalid status transition: ${errand.status} → ${dto.status}`);
    }

    const updates: any = { status: dto.status };
    if (dto.status === ErrandStatus.PICKED_UP) updates.picked_up_at = new Date().toISOString();
    if (dto.status === ErrandStatus.DELIVERED) {
      updates.delivered_at = new Date().toISOString();
      updates.delivery_proof_url = dto.deliveryProofUrl;
    }
    if (dto.status === ErrandStatus.CANCELLED) {
      updates.cancelled_at = new Date().toISOString();
      updates.cancel_reason = dto.cancelReason;
    }

    const { data: updated } = await this.supabase
      .from('errands')
      .update(updates)
      .eq('id', errandId)
      .select()
      .single();

    await this.notifications.notifyErrandStatusChange(errand.customer_id, errandId, dto.status);

    if (dto.status === ErrandStatus.DELIVERED) {
      await this.processErrandCompletion(errand);
    }

    return updated;
  }

  async uploadDeliveryProof(riderUserId: string, errandId: string, file: Express.Multer.File) {
    const { data: errand } = await this.supabase
      .from('errands')
      .select('id, riders!inner(user_id)')
      .eq('id', errandId)
      .single();

    if (!errand) throw new NotFoundException('Errand not found');
    const riderEntry = Array.isArray(errand.riders) ? errand.riders[0] : errand.riders;
    if ((riderEntry as any)?.user_id !== riderUserId) throw new ForbiddenException('Not your errand');

    const ext = file.originalname.split('.').pop();
    const path = `delivery-proofs/${errandId}/${Date.now()}.${ext}`;

    const { error } = await this.supabase
      .storage('ubike-assets')
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) throw new BadRequestException('Upload failed');

    const { data: urlData } = this.supabase.storage('ubike-assets').getPublicUrl(path);

    await this.supabase
      .from('errands')
      .update({ delivery_proof_url: urlData.publicUrl })
      .eq('id', errandId);

    return { proofUrl: urlData.publicUrl };
  }

  async rateErrand(customerId: string, errandId: string, dto: RateErrandDto) {
    const { data: errand } = await this.supabase
      .from('errands')
      .select('*')
      .eq('id', errandId)
      .eq('customer_id', customerId)
      .eq('status', ErrandStatus.DELIVERED)
      .single();

    if (!errand) throw new NotFoundException('Errand not found or not delivered');
    if (errand.is_rated) throw new BadRequestException('Already rated');

    await Promise.all([
      this.supabase.from('reviews').insert({
        errand_id: errandId,
        reviewer_id: customerId,
        reviewee_id: errand.rider_id,
        rating: dto.rating,
        comment: dto.comment,
        reviewer_type: 'customer',
      }),
      this.supabase.from('errands').update({ is_rated: true }).eq('id', errandId),
    ]);

    return { message: 'Rating submitted' };
  }

  private async processErrandCompletion(errand: any) {
    const commission = Math.round(errand.estimated_fare * 0.2);
    const riderEarning = errand.estimated_fare - commission;

    await Promise.all([
      this.supabase.rpc('deduct_wallet', { p_user_id: errand.customer_id, p_amount: errand.estimated_fare }),
      this.supabase.rpc('credit_wallet', { p_user_id: errand.rider_id, p_amount: riderEarning }),
      this.supabase.from('wallet_transactions').insert([
        { user_id: errand.customer_id, type: 'errand_payment', amount: -errand.estimated_fare, reference_id: errand.id },
        { user_id: errand.rider_id, type: 'earning', amount: riderEarning, reference_id: errand.id },
      ]),
      this.supabase.rpc('increment_rider_trips', { p_rider_id: errand.rider_id }),
    ]);
  }
}
