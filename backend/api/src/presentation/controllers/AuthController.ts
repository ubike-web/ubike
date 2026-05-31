import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { authService } from '../../application/use-cases/auth/AuthService';
import { ok, created } from '../../shared/response';
import { AuthRequest } from '../middlewares/auth.middleware';

const phoneSchema = Joi.object({ phone: Joi.string().required() });
const otpVerifySchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).required(),
  role: Joi.string().valid('customer', 'passenger_rider', 'errands_rider').default('customer'),
});
const emailRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().required(),
  role: Joi.string().valid('customer', 'passenger_rider', 'errands_rider', 'admin', 'super_admin').default('customer'),
});
const emailLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
const refreshSchema = Joi.object({ refresh_token: Joi.string().required() });

export class AuthController {
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = phoneSchema.validate(req.body);
      if (error) throw error;
      const result = await authService.sendPhoneOtp(value.phone);
      ok(res, result);
    } catch (e) { next(e); }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = otpVerifySchema.validate(req.body);
      if (error) throw error;
      const result = await authService.verifyPhoneOtp(value.phone, value.otp, value.role);
      created(res, result);
    } catch (e) { next(e); }
  }

  async registerEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = emailRegisterSchema.validate(req.body);
      if (error) throw error;
      const result = await authService.registerWithEmail(value.email, value.password, value.full_name, value.role);
      created(res, result);
    } catch (e) { next(e); }
  }

  async loginEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = emailLoginSchema.validate(req.body);
      if (error) throw error;
      const result = await authService.loginWithEmail(value.email, value.password);
      ok(res, result);
    } catch (e) { next(e); }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = refreshSchema.validate(req.body);
      if (error) throw error;
      const tokens = await authService.refreshToken(value.refresh_token);
      ok(res, tokens);
    } catch (e) { next(e); }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const { refresh_token } = req.body;
      await authService.logout(user.sub, refresh_token);
      ok(res, null, 'Logged out successfully');
    } catch (e) { next(e); }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      ok(res, { id: user.sub, role: user.role, email: user.email, phone: user.phone });
    } catch (e) { next(e); }
  }
}

export const authController = new AuthController();
