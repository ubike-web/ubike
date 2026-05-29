import { getSupabaseClient } from '../../config/supabase';
import { Errand } from '../../domain/entities/Errand';
import { NotFoundError } from '../../shared/errors';
import { ErrandStatus } from '../../shared/types';

export class ErrandRepository {
  private get db() { return getSupabaseClient(); }

  async findById(id: string): Promise<Errand> {
    const { data, error } = await this.db.from('errands').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundError('Errand');
    return data as Errand;
  }

  async create(errand: Partial<Errand>): Promise<Errand> {
    const { data, error } = await this.db.from('errands').insert(errand).select().single();
    if (error) throw new Error(error.message);
    return data as Errand;
  }

  async update(id: string, updates: Partial<Errand>): Promise<Errand> {
    const { data, error } = await this.db
      .from('errands')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Errand;
  }

  async updateStatus(id: string, status: ErrandStatus, extra?: Partial<Errand>): Promise<Errand> {
    return this.update(id, { status, ...extra });
  }

  async findByCustomer(customerId: string, page: number, limit: number): Promise<{ data: Errand[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, count, error } = await this.db
      .from('errands')
      .select('*', { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []) as Errand[], count: count || 0 };
  }

  async findByRider(riderId: string, page: number, limit: number): Promise<{ data: Errand[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, count, error } = await this.db
      .from('errands')
      .select('*', { count: 'exact' })
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []) as Errand[], count: count || 0 };
  }

  async listAll(page: number, limit: number, status?: ErrandStatus): Promise<{ data: Errand[]; count: number }> {
    const from = (page - 1) * limit;
    let query = this.db.from('errands').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []) as Errand[], count: count || 0 };
  }
}

export const errandRepository = new ErrandRepository();
