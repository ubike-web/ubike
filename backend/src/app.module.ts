import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from 'joi';

import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RidersModule } from './modules/riders/riders.module';
import { RidesModule } from './modules/rides/rides.module';
import { ErrandsModule } from './modules/errands/errands.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChatModule } from './modules/chat/chat.module';
import { CallsModule } from './modules/calls/calls.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OtpModule } from './modules/otp/otp.module';
import { MapsModule } from './modules/maps/maps.module';
import { MatchingModule } from './modules/matching/matching.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  controllers: [HealthController],
  imports: [
    // Config — validate all required env vars at startup
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        JWT_SECRET: Joi.string().required(),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        PAYSTACK_SECRET_KEY: Joi.string().required(),
        AFRICASTALKING_API_KEY: Joi.string().required(),
        MAPBOX_ACCESS_TOKEN: Joi.string().required(),
        AGORA_APP_ID: Joi.string().required(),
        AGORA_APP_CERTIFICATE: Joi.string().required(),
      }),
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    RidersModule,
    RidesModule,
    ErrandsModule,
    WalletsModule,
    PaymentsModule,
    ChatModule,
    CallsModule,
    NotificationsModule,
    OtpModule,
    MapsModule,
    MatchingModule,
    AdminModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
