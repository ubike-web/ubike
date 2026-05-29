import { Request, Response, NextFunction } from 'express';
import { errandService } from '../../application/use-cases/errands/ErrandService';
import { errandRepository } from '../../infrastructure/repositories/ErrandRepository';
import { ok, created, paginated } from '../../shared/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ErrandController {
  async request(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const errand = await errandService.requestErrand(user.sub, req.body);
      created(res, errand);
    } catch (e) { next(e); }
  }

  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const errand = await errandService.acceptErrand(user.sub, req.params.id);
      ok(res, errand);
    } catch (e) { next(e); }
  }

  async pickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const errand = await errandService.pickupErrand(user.sub, req.params.id);
      ok(res, errand);
    } catch (e) { next(e); }
  }

  async transit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const errand = await errandService.startTransit(user.sub, req.params.id);
      ok(res, errand);
    } catch (e) { next(e); }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { proof_url } = req.body;
      const errand = await errandService.completeErrand(user.sub, req.params.id, proof_url);
      ok(res, errand);
    } catch (e) { next(e); }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { reason } = req.body;
      const errand = await errandService.cancelErrand(user.sub, req.params.id, reason || 'Cancelled by user');
      ok(res, errand);
    } catch (e) { next(e); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errand = await errandRepository.findById(req.params.id);
      ok(res, errand);
    } catch (e) { next(e); }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      let result;
      if (user.role === 'customer') {
        result = await errandRepository.findByCustomer(user.sub, page, limit);
      } else {
        result = await errandRepository.findByRider(user.sub, page, limit);
      }
      paginated(res, result.data, { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit) });
    } catch (e) { next(e); }
  }
}

export const errandController = new ErrandController();
