import { getSupabaseClient } from '../../config/supabase';
import { User, RiderProfile, CustomerProfile } from '../../domain/entities/User';
import { NotFoundError } from '../../shared/errors';

export class UserRepository {
  private get db() { return getSupabaseClient(); }

  async findById(id: string): Promise<User> {
    const { data, error } = await this.db.from('users').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundError('User');
    return data as User;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const { data } = await this.db.from('users').select('*').eq('phone', phone).single();
    return data as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data } = await this.db.from('users').select('*').eq('email', email).single();
    return data as User | null;
  }

  async create(user: Partial<User>): Promise<User> {
    const { data, error } = await this.db.from('users').insert(user).select().single();
    if (error) throw new Error(error.message);
    return data as User;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.db
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as User;
  }

  async findRiderProfile(userId: string): Promise<RiderProfile | null> {
    const { data } = await this.db.from('rider_profiles').select('*').eq('user_id', userId).single();
    return data as RiderProfile | null;
  }

  async findCustomerProfile(userId: string): Promise<CustomerProfile | null> {
    const { data } = await this.db.from('customer_profiles').select('*').eq('user_id', userId).single();
    return data as CustomerProfile | null;
  }

  async updateRiderProfile(userId: string, updates: Partial<RiderProfile>): Promise<RiderProfile> {
    const { data, error } = await this.db
      .from('rider_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as RiderProfile;
  }

  async updateRiderLocation(userId: string, lat: number, lng: number): Promise<void> {
    await this.db
      .from('rider_profiles')
      .update({ current_lat: lat, current_lng: lng, last_location_update: new Date().toISOString() })
      .eq('user_id', userId);
  }

  async findAvailableRiders(lat: number, lng: number, radiusKm: number, riderType: 'passenger' | 'errands'): Promise<RiderProfile[]> {
    // Using PostGIS ST_DWithin via Supabase RPC
    const { data } = await this.db.rpc('find_available_riders', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radiusKm,
      p_rider_type: riderType,
    });
    return (data || []) as RiderProfile[];
  }

  async listAll(page: number, limit: number, role?: string): Promise<{ data: User[]; count: number }> {
    let query = this.db.from('users').select('*', { count: 'exact' });
    if (role) query = query.eq('role', role);
    const from = (page - 1) * limit;
    const { data, count, error } = await query.range(from, from + limit - 1).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { data: (data || []) as User[], count: count || 0 };
  }
}

export const userRepository = new UserRepository();
