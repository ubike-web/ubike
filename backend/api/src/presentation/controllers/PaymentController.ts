import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../../application/use-cases/payments/PaymentService';
import { ok, paginated } from '../../shared/response';
import { AuthRequest } from '../middlewares/auth.middleware';

export class PaymentController {
  async initRidePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { rideId, email } = req.body;
      const result = await paymentService.initializeRidePayment(user.sub, rideId, email);
      ok(res, result);
    } catch (e) { next(e); }
  }

  async initErrandPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { errandId, email } = req.body;
      const result = await paymentService.initializeErrandPayment(user.sub, errandId, email);
      ok(res, result);
    } catch (e) { next(e); }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await paymentService.verifyAndProcess(req.params.reference);
      ok(res, null, 'Payment verified and processed');
    } catch (e) { next(e); }
  }

  async paystackWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = String(req.headers['x-paystack-signature'] || '');
      await paymentService.handleWebhook(JSON.stringify(req.body), signature);
      res.sendStatus(200);
    } catch (e) { next(e); }
  }

  async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const balance = await paymentService.getWalletBalance(user.sub);
      ok(res, { balance, currency: 'KES' });
    } catch (e) { next(e); }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      const result = await paymentService.getUserTransactions(user.sub, page, limit);
      paginated(res, result.data, { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) });
    } catch (e) { next(e); }
  }
}

export const paymentController = new PaymentController();
