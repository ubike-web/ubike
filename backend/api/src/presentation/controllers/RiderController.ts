import { Request, Response, NextFunction } from 'express';
import { riderService } from '../../application/use-cases/riders/RiderService';
import { userRepository } from '../../infrastructure/repositories/UserRepository';
import { ok } from '../../shared/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export class RiderController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const profile = await userRepository.findRiderProfile(user.sub);
      ok(res, profile);
    } catch (e) { next(e); }
  }

  async toggleOnline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { available } = req.body;
      const profile = await riderService.toggleAvailability(user.sub, !!available);
      ok(res, profile);
    } catch (e) { next(e); }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { lat, lng } = req.body;
      await riderService.updateLocation(user.sub, +lat, +lng);
      ok(res, null, 'Location updated');
    } catch (e) { next(e); }
  }

  async submitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      await riderService.submitKyc(user.sub, req.body);
      ok(res, null, 'KYC documents submitted for review');
    } catch (e) { next(e); }
  }

  async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const earnings = await riderService.getEarnings(user.sub);
      ok(res, earnings);
    } catch (e) { next(e); }
  }

  async getCallToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { rideId } = req.params;
      const token = await riderService.generateCallToken(user.sub, rideId);
      ok(res, token);
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const stats = await riderService.getPerformanceStats(user.sub);
      ok(res, stats);
    } catch (e) { next(e); }
  }
}

export const riderController = new RiderController();
