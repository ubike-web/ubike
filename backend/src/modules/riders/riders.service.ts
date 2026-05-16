import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { UpdateLocationDto, ToggleOnlineDto, UpdateRiderFcmDto } from './dto/riders.dto';
import { RiderServiceType } from '../../common/enums/user-role.enum';

@Injectable()
export class RidersService {
  constructor(private supabase: SupabaseService) {}

  async getRiderProfile(riderId: string) {
    const { data, error } = await this.supabase
      .from('riders')
      .select(`
        id, service_type, verification_status, is_online,
        rating, total_trips, acceptance_rate, cancellation_rate,
        created_at,
        users(id, full_name, phone, email, avatar_url),
        vehicles(*)
      `)
      .eq('id', riderId)
      .single();

    if (error || !data) throw new NotFoundException('Rider not found');
    return data;
  }

  async getRiderByUserId(userId: string) {
    const { data } = await this.supabase
      .from('riders')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  }

  async toggleOnline(userId: string, dto: ToggleOnlineDto) {
    const rider = await this.getRiderByUserId(userId);
    if (!rider) throw new NotFoundException('Rider profile not found');
    if (rider.verification_status !== 'verified') {
      throw new ForbiddenException('Rider not verified — cannot go online');
    }

    const { data, error } = await this.supabase
      .from('riders')
      .update({ is_online: dto.isOnline, last_seen: new Date().toISOString() })
      .eq('id', rider.id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { isOnline: data.is_online };
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const rider = await this.getRiderByUserId(userId);
    if (!rider) throw new NotFoundException('Rider not found');

    const { error } = await this.supabase
      .from('riders')
      .update({
        current_lat: dto.latitude,
        current_lng: dto.longitude,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', rider.id);

    if (error) throw new BadRequestException(error.message);
    return { updated: true };
  }

  async getDashboard(userId: string) {
    const rider = await this.getRiderByUserId(userId);
    if (!rider) throw new NotFoundException('Rider not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const table = rider.service_type === RiderServiceType.TRANSPORT ? 'rides' : 'errands';
    const statusField = rider.service_type === RiderServiceType.TRANSPORT ? 'completed' : 'delivered';

    const [todayEarnings, weeklyEarnings, wallet] = await Promise.all([
      this.supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', rider.user_id)
        .eq('type', 'earning')
        .gte('created_at', today.toISOString()),
      this.supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', rider.user_id)
        .eq('type', 'earning')
        .gte('created_at', weekStart.toISOString()),
      this.supabase
        .from('wallets')
        .select('balance, total_earned')
        .eq('user_id', rider.user_id)
        .single(),
    ]);

    const sumAmounts = (rows: any[]) =>
      (rows || []).reduce((acc, r) => acc + Number(r.amount), 0);

    return {
      riderId: rider.id,
      serviceType: rider.service_type,
      isOnline: rider.is_online,
      rating: rider.rating,
      totalTrips: rider.total_trips,
      acceptanceRate: rider.acceptance_rate,
      cancellationRate: rider.cancellation_rate,
      todayEarnings: sumAmounts(todayEarnings.data ?? []),
      weeklyEarnings: sumAmounts(weeklyEarnings.data ?? []),
      walletBalance: wallet.data?.balance ?? 0,
      totalEarned: wallet.data?.total_earned ?? 0,
    };
  }

  async uploadDocument(userId: string, docType: string, file: Express.Multer.File) {
    const rider = await this.getRiderByUserId(userId);
    if (!rider) throw new NotFoundException('Rider not found');

    const ext = file.originalname.split('.').pop();
    const path = `rider-docs/${rider.id}/${docType}.${ext}`;

    const { error } = await this.supabase
      .storage('ubike-assets')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) throw new BadRequestException('Document upload failed');

    const { data: urlData } = this.supabase.storage('ubike-assets').getPublicUrl(path);

    await this.supabase.from('rider_documents').upsert({
      rider_id: rider.id,
      doc_type: docType,
      doc_url: urlData.publicUrl,
      status: 'pending',
    });

    return { docUrl: urlData.publicUrl };
  }

  async updateFcmToken(userId: string, dto: UpdateRiderFcmDto) {
    await this.supabase.from('users').update({ fcm_token: dto.fcmToken }).eq('id', userId);
    return { message: 'FCM token updated' };
  }
}
