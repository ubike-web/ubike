import 'dotenv/config';
import Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),

  REDIS_URL: Joi.string().required(),

  PAYSTACK_SECRET_KEY: Joi.string().required(),
  PAYSTACK_PUBLIC_KEY: Joi.string().required(),
  PAYSTACK_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  PAYSTACK_BASE_URL: Joi.string().default('https://api.paystack.co'),

  AFRICASTALKING_API_KEY: Joi.string().required(),
  AFRICASTALKING_USERNAME: Joi.string().default('sandbox'),
  AFRICASTALKING_SENDER_ID: Joi.string().default('UBIKE'),

  ORS_API_KEY: Joi.string().allow('').default(''),
  ZEGO_APP_ID: Joi.string().allow('').default(''),
  ZEGO_SERVER_SECRET: Joi.string().allow('').default(''),

  OTP_EXPIRY_MINUTES: Joi.number().default(5),
  OTP_MAX_ATTEMPTS: Joi.number().default(3),
  OTP_RESEND_COOLDOWN_SECONDS: Joi.number().default(60),

  PLATFORM_COMMISSION_STANDARD: Joi.number().default(0.20),
  PLATFORM_COMMISSION_ADJUSTED: Joi.number().default(0.25),
  BASE_FARE_KES: Joi.number().default(100),
  KM_RATE_KES: Joi.number().default(50),
  ERRAND_BASE_FARE_KES: Joi.number().default(150),
  RIDER_MATCH_RADIUS_KM: Joi.number().default(5),
  RIDER_REQUEST_TIMEOUT_SECONDS: Joi.number().default(30),
  MAX_FARE_RAISE_PERCENT: Joi.number().default(30),

  THROTTLE_WINDOW_MS: Joi.number().default(60000),
  THROTTLE_MAX: Joi.number().default(100),

  ENCRYPTION_KEY: Joi.string().allow('').default(''),
}).unknown(true);

const { error, value } = schema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = value as {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REDIS_URL: string;
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  PAYSTACK_WEBHOOK_SECRET: string;
  PAYSTACK_BASE_URL: string;
  AFRICASTALKING_API_KEY: string;
  AFRICASTALKING_USERNAME: string;
  AFRICASTALKING_SENDER_ID: string;
  ORS_API_KEY: string;
  ZEGO_APP_ID: string;
  ZEGO_SERVER_SECRET: string;
  OTP_EXPIRY_MINUTES: number;
  OTP_MAX_ATTEMPTS: number;
  OTP_RESEND_COOLDOWN_SECONDS: number;
  PLATFORM_COMMISSION_STANDARD: number;
  PLATFORM_COMMISSION_ADJUSTED: number;
  BASE_FARE_KES: number;
  KM_RATE_KES: number;
  ERRAND_BASE_FARE_KES: number;
  RIDER_MATCH_RADIUS_KM: number;
  RIDER_REQUEST_TIMEOUT_SECONDS: number;
  MAX_FARE_RAISE_PERCENT: number;
  THROTTLE_WINDOW_MS: number;
  THROTTLE_MAX: number;
  ENCRYPTION_KEY: string;
};
