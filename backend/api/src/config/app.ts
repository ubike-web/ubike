import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './env';

import authRoutes from '../presentation/routes/auth.routes';
import rideRoutes from '../presentation/routes/ride.routes';
import errandRoutes from '../presentation/routes/errand.routes';
import riderRoutes from '../presentation/routes/rider.routes';
import paymentRoutes from '../presentation/routes/payment.routes';
import adminRoutes from '../presentation/routes/admin.routes';
import { errorHandler, notFoundHandler } from '../presentation/middlewares/error.middleware';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Paystack-Signature'],
  }));

  // Parse raw body for Paystack webhook before JSON middleware
  app.use('/api/v1/payments/webhook/paystack', express.raw({ type: 'application/json' }));

  // Body parsing
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.THROTTLE_WINDOW_MS,
    max: env.THROTTLE_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
  });
  app.use('/api/', limiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ubike-api', timestamp: new Date().toISOString() });
  });

  // API routes
  const prefix = '/api/v1';
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/rides`, rideRoutes);
  app.use(`${prefix}/errands`, errandRoutes);
  app.use(`${prefix}/riders`, riderRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/admin`, adminRoutes);

  // 404 + error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
