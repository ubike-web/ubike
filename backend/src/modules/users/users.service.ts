import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { UpdateProfileDto, SavedLocationDto, UpdateFcmTokenDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        id, full_name, phone, email, avatar_url, role,
        is_phone_verified, created_at,
        customers(*)
      `)
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updates: any = {};
    if (dto.fullName) updates.full_name = dto.fullName;
    if (dto.email) updates.email = dto.email;

    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop();
    const path = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await this.supabase
      .storage('ubike-assets')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) throw new BadRequestException('Avatar upload failed');

    const { data: urlData } = this.supabase.storage('ubike-assets').getPublicUrl(path);

    await this.supabase
      .from('users')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId);

    return { avatarUrl: urlData.publicUrl };
  }

  async getSavedLocations(userId: string) {
    const { data } = await this.supabase
      .from('saved_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  async saveLocation(userId: string, dto: SavedLocationDto) {
    const { data, error } = await this.supabase
      .from('saved_locations')
      .insert({ user_id: userId, ...dto })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteLocation(userId: string, locationId: string) {
    const { error } = await this.supabase
      .from('saved_locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Location deleted' };
  }

  async updateFcmToken(userId: string, dto: UpdateFcmTokenDto) {
    await this.supabase
      .from('users')
      .update({ fcm_token: dto.fcmToken })
      .eq('id', userId);
    return { message: 'FCM token updated' };
  }

  async getRideHistory(userId: string, limit = 20, offset = 0) {
    const { data } = await this.supabase
      .from('rides')
      .select(`
        id, status, pickup_address, destination_address,
        fare_amount, created_at, completed_at,
        riders(users(full_name, avatar_url))
      `)
      .eq('customer_id', userId)
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return data ?? [];
  }

  async getErrandHistory(userId: string, limit = 20, offset = 0) {
    const { data } = await this.supabase
      .from('errands')
      .select(`
        id, status, pickup_address, delivery_address,
        fare_amount, item_description, created_at, completed_at,
        riders(users(full_name, avatar_url))
      `)
      .eq('customer_id', userId)
      .in('status', ['delivered', 'cancelled'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return data ?? [];
  }
}
