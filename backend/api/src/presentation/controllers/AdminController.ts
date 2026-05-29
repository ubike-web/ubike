import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../../config/supabase';
import { userRepository } from '../../infrastructure/repositories/UserRepository';
import { rideRepository } from '../../infrastructure/repositories/RideRepository';
import { errandRepository } from '../../infrastructure/repositories/ErrandRepository';
import { ok, paginated } from '../../shared/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AdminController {
  private get db() { return getSupabaseClient(); }

  async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        { count: totalUsers },
        { count: activeRiders },
        { count: totalRides },
        { count: activeRides },
        { count: totalErrands },
      ] = await Promise.all([
        this.db.from('users').select('*', { count: 'exact', head: true }),
        this.db.from('rider_profiles').select('*', { count: 'exact', head: true }).eq('is_available', true),
        this.db.from('rides').select('*', { count: 'exact', head: true }),
        this.db.from('rides').select('*', { count: 'exact', head: true }).in('status', ['requested', 'accepted', 'in_progress']),
        this.db.from('errands').select('*', { count: 'exact', head: true }),
      ]);

      const { data: revenue } = await this.db
        .from('transactions')
        .select('amount')
        .eq('status', 'success')
        .in('type', ['ride_payment', 'errand_payment']);

      const totalRevenue = (revenue || []).reduce((sum, t) => sum + (t.amount || 0), 0);

      ok(res, { totalUsers, activeRiders, totalRides, activeRides, totalErrands, totalRevenue });
    } catch (e) { next(e); }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      const role = req.query.role as string | undefined;
      const result = await userRepository.listAll(page, limit, role);
      paginated(res, result.data, { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit) });
    } catch (e) { next(e); }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userRepository.findById(req.params.id);
      ok(res, user);
    } catch (e) { next(e); }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userRepository.update(req.params.id, { is_active: false });
      ok(res, user, 'User suspended');
    } catch (e) { next(e); }
  }

  async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userRepository.update(req.params.id, { is_active: true });
      ok(res, user, 'User activated');
    } catch (e) { next(e); }
  }

  async approveKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const admin = (req as AuthRequest).user;
      await this.db.from('kyc_documents').update({
        status: 'approved',
        reviewed_by: admin.sub,
        reviewed_at: new Date().toISOString(),
      }).eq('user_id', userId);
      await userRepository.updateRiderProfile(userId, { is_kyc_verified: true });
      ok(res, null, 'KYC approved');
    } catch (e) { next(e); }
  }

  async rejectKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const admin = (req as AuthRequest).user;
      const { reason } = req.body;
      await this.db.from('kyc_documents').update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: admin.sub,
        reviewed_at: new Date().toISOString(),
      }).eq('user_id', userId);
      ok(res, null, 'KYC rejected');
    } catch (e) { next(e); }
  }

  async listRides(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      const status = req.query.status as any;
      const result = await rideRepository.listAll(page, limit, status);
      paginated(res, result.data, { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit) });
    } catch (e) { next(e); }
  }

  async listErrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      const status = req.query.status as any;
      const result = await errandRepository.listAll(page, limit, status);
      paginated(res, result.data, { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit) });
    } catch (e) { next(e); }
  }

  async listKycRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      const status = (req.query.status as string) || 'pending';
      const from = (page - 1) * limit;
      const { data, count } = await this.db
        .from('kyc_documents')
        .select('*, users(full_name, phone, email)', { count: 'exact' })
        .eq('status', status)
        .range(from, from + limit - 1)
        .order('submitted_at', { ascending: false });
      paginated(res, data || [], { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) });
    } catch (e) { next(e); }
  }

  async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query;
      let query = this.db.from('transactions').select('type, amount, created_at').eq('status', 'success');
      if (from) query = query.gte('created_at', from as string);
      if (to) query = query.lte('created_at', to as string);
      const { data } = await query;

      const grouped = (data || []).reduce((acc: Record<string, number>, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
        return acc;
      }, {});

      ok(res, { breakdown: grouped, total: Object.values(grouped).reduce((a, b) => a + b, 0) });
    } catch (e) { next(e); }
  }
}

export const adminController = new AdminController();
