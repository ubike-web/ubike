import { Request, Response, NextFunction } from 'express';
import { rideService } from '../../application/use-cases/rides/RideService';
import { rideRepository } from '../../infrastructure/repositories/RideRepository';
import { ok, created, paginated } from '../../shared/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export class RideController {
  async estimate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, vehicle_type } = req.body;
      const estimate = await rideService.getFareEstimate(
        { lat: +pickup_lat, lng: +pickup_lng },
        { lat: +dropoff_lat, lng: +dropoff_lng },
        vehicle_type,
      );
      ok(res, estimate);
    } catch (e) { next(e); }
  }

  async request(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const ride = await rideService.requestRide(user.sub, req.body);
      created(res, ride);
    } catch (e) { next(e); }
  }

  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const ride = await rideService.acceptRide(user.sub, req.params.id);
      ok(res, ride);
    } catch (e) { next(e); }
  }

  async arrived(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const ride = await rideService.riderArrived(user.sub, req.params.id);
      ok(res, ride);
    } catch (e) { next(e); }
  }

  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const ride = await rideService.startRide(user.sub, req.params.id);
      ok(res, ride);
    } catch (e) { next(e); }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const ride = await rideService.completeRide(user.sub, req.params.id);
      ok(res, ride);
    } catch (e) { next(e); }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { reason } = req.body;
      const ride = await rideService.cancelRide(user.sub, req.params.id, reason || 'Cancelled by user');
      ok(res, ride);
    } catch (e) { next(e); }
  }

  async proposeFare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { proposed_fare } = req.body;
      await rideService.proposeFareAdjustment(user.sub, req.params.id, +proposed_fare);
      ok(res, null, 'Fare proposal sent');
    } catch (e) { next(e); }
  }

  async respondFare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { accepted, counter_fare } = req.body;
      await rideService.respondFareProposal(user.sub, req.params.id, accepted, counter_fare);
      ok(res, null, accepted ? 'Fare accepted' : 'Fare rejected');
    } catch (e) { next(e); }
  }

  async rate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { rating } = req.body;
      const role = user.role === 'customer' ? 'customer' : 'rider';
      await rideService.rateRide(user.sub, req.params.id, +rating, role);
      ok(res, null, 'Rating submitted');
    } catch (e) { next(e); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ride = await rideRepository.findById(req.params.id);
      ok(res, ride);
    } catch (e) { next(e); }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      let result;
      if (user.role === 'customer') {
        result = await rideRepository.findByCustomer(user.sub, page, limit);
      } else {
        result = await rideRepository.findByRider(user.sub, page, limit);
      }
      paginated(res, result.data, { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit) });
    } catch (e) { next(e); }
  }
}

export const rideController = new RideController();
