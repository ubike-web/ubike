import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterCustomerDto,
  RegisterRiderDto,
  LoginDto,
  RefreshTokenDto,
  VerifyPhoneDto,
  ResendOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OtpService } from '../otp/otp.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private auth: AuthService, private otp: OtpService) {}

  @Public()
  @Post('register/customer')
  @ApiOperation({ summary: 'Register a new customer' })
  registerCustomer(@Body() dto: RegisterCustomerDto) {
    return this.auth.registerCustomer(dto);
  }

  @Public()
  @Post('register/rider')
  @ApiOperation({ summary: 'Register a new rider (transport or errands)' })
  registerRider(@Body() dto: RegisterRiderDto) {
    return this.auth.registerRider(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone + password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone number with OTP' })
  verifyPhone(@Body() dto: VerifyPhoneDto) {
    return this.auth.verifyPhone(dto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Resend OTP to phone number' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.otp.sendOtp(dto.phone, 'verification');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current user' })
  logout(@CurrentUser() user: { id: string }) {
    return this.auth.logout(user.id);
  }
}
