import { getSupabaseClient } from '../../config/supabase';
import { Ride } from '../../domain/entities/Ride';
import { NotFoundError } from '../../shared/errors';
import { RideStatus } from '../../shared/types';

export class RideRepository {
  private get db() { return getSupabaseClient(); }

  async findById(id: string): Promise<Ride> {
    const { data, error } = await this.db.from('rides').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundError('Ride');
    return data as Ride;
  }

  async create(ride: Partial<Ride>): Promise<Ride> {
    const { data, error } = await this.db.from('rides').insert(ride).select().single();
    if (error) throw new Error(error.message);
    return data as Ride;
  }

  async update(id: string, updates: Partial<Ride>): Promise<Ride> {
    const { data, error } = await this.db
      .from('rides')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Ride;
  }

  async findByCustomer(customerId: string, page: number, limit: number): Promise<{ data: Ride[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, count, error } = await this.db
      .from('rides')
      .select('*', { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []) as Ride[], count: count || 0 };
  }

  async findByRider(riderId: string, page: number, limit: number): Promise<{ data: Ride[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, count, error } = await this.db
      .from('rides')
      .select('*', { count: 'exact' })
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []) as Ride[], count: count || 0 };
  }

  async updateStatus(id: string, status: RideStatus, extra?: Partial<Ride>): Promise<Ride> {
    return this.update(id, { status, ...extra });
  }

  async findActiveByRider(riderId: string): Promise<Ride | null> {
    const { data } = await this.db
      .from('rides')
      .select('*')
      .eq('rider_id', riderId)
      .in('status', ['accepted', 'rider_arrived', 'in_progress', 'fare_negotiation'])
      .single();
    return data as Ride | null;
  }

  async listAll(page: number, limit: number, status?: RideStatus): Promise<{ data: Ride[]; count: number }> {
    const from = (page - 1) * limit;
    let query = this.db.from('rides').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []) as Ride[], count: count || 0 };
  }
}

export const rideRepository = new RideRepository();
