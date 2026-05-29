import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtPayload, UserRole } from '../../shared/types';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';

export interface AuthRequest extends Request {
  user: JwtPayload;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthRequest).user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user) return next(new UnauthorizedError());
    if (!roles.includes(user.role)) {
      return next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthRequest).user = payload;
  } catch {
    // ignore, proceed without auth
  }
  next();
}
