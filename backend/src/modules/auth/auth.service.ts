import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../../database/supabase.service';
import { OtpService } from '../otp/otp.service';
import { UserRole, VerificationStatus, RiderServiceType } from '../../common/enums/user-role.enum';
import {
  RegisterCustomerDto,
  RegisterRiderDto,
  LoginDto,
  RefreshTokenDto,
  VerifyPhoneDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabase: SupabaseService,
    private jwt: JwtService,
    private config: ConfigService,
    private otp: OtpService,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto) {
    const existing = await this.supabase
      .from('users')
      .select('id')
      .eq('phone', dto.phone)
      .single();

    if (existing.data) throw new ConflictException('Phone number already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const { data: user, error } = await this.supabase.from('users').insert({
      full_name: dto.fullName,
      phone: dto.phone,
      email: dto.email || null,
      password_hash: passwordHash,
      role: UserRole.CUSTOMER,
      is_phone_verified: false,
      is_active: true,
    }).select().single();

    if (error) throw new BadRequestException(error.message);

    // Create customer profile
    await this.supabase.from('customers').insert({ user_id: user.id });

    // Create wallet
    await this.supabase.from('wallets').insert({ user_id: user.id, balance: 0 });

    // Send OTP for phone verification
    await this.otp.sendOtp(dto.phone, 'verification');

    return {
      message: 'Registration successful. Please verify your phone number.',
      userId: user.id,
    };
  }

  async registerRider(dto: RegisterRiderDto) {
    const existing = await this.supabase
      .from('users')
      .select('id')
      .eq('phone', dto.phone)
      .single();

    if (existing.data) throw new ConflictException('Phone number already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role =
      dto.serviceType === RiderServiceType.TRANSPORT
        ? UserRole.TRANSPORT_RIDER
        : UserRole.ERRANDS_RIDER;

    const { data: user, error } = await this.supabase.from('users').insert({
      full_name: dto.fullName,
      phone: dto.phone,
      email: dto.email || null,
      password_hash: passwordHash,
      role,
      is_phone_verified: false,
      is_active: true,
    }).select().single();

    if (error) throw new BadRequestException(error.message);

    // Create rider profile
    const { data: rider } = await this.supabase.from('riders').insert({
      user_id: user.id,
      service_type: dto.serviceType,
      verification_status: VerificationStatus.PENDING,
      is_online: false,
      rating: 5.0,
      total_trips: 0,
      acceptance_rate: 100,
    }).select().single();

    // Create vehicle record
    await this.supabase.from('vehicles').insert({
      rider_id: rider.id,
      vehicle_type: dto.vehicleType,
      plate_number: dto.plateNumber,
      model: dto.vehicleModel,
      color: dto.vehicleColor,
      is_verified: false,
    });

    // Create rider wallet
    await this.supabase.from('wallets').insert({
      user_id: user.id,
      balance: 0,
      total_earned: 0,
    });

    // Send OTP for phone verification
    await this.otp.sendOtp(dto.phone, 'verification');

    return {
      message: 'Rider registration submitted. Verify phone and await admin approval.',
      userId: user.id,
      riderId: rider.id,
    };
  }

  async login(dto: LoginDto) {
    const { data: user } = await this.supabase
      .from('users')
      .select('*')
      .eq('phone', dto.phone)
      .single();

    if (!user) throw new UnauthorizedException('Invalid phone or password');

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) throw new UnauthorizedException('Invalid phone or password');

    if (!user.is_active) throw new UnauthorizedException('Account is suspended');

    if (!user.is_phone_verified) {
      await this.otp.sendOtp(dto.phone, 'verification');
      throw new UnauthorizedException('Phone not verified. OTP sent.');
    }

    // For riders — check verification status
    if ([UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER].includes(user.role)) {
      const { data: rider } = await this.supabase
        .from('riders')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (rider?.verification_status === VerificationStatus.PENDING) {
        throw new UnauthorizedException('Rider account pending admin approval');
      }
      if (rider?.verification_status === VerificationStatus.REJECTED) {
        throw new UnauthorizedException('Rider account has been rejected');
      }
      if (rider?.verification_status === VerificationStatus.SUSPENDED) {
        throw new UnauthorizedException('Rider account is suspended');
      }
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, role: user.role, userId: user.id };
  }

  async verifyPhone(dto: VerifyPhoneDto) {
    const valid = await this.otp.verifyOtp(dto.phone, dto.code, 'verification');
    if (!valid) throw new BadRequestException('Invalid or expired OTP');

    const { error } = await this.supabase
      .from('users')
      .update({ is_phone_verified: true })
      .eq('phone', dto.phone);

    if (error) throw new BadRequestException(error.message);

    return { message: 'Phone verified successfully' };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const secret = this.config.getOrThrow('JWT_REFRESH_SECRET');
    try {
      const payload = this.jwt.verify(dto.refreshToken, { secret });
      const { data: user } = await this.supabase
        .from('users')
        .select('id, role, refresh_token_hash')
        .eq('id', payload.sub)
        .single();

      if (!user) throw new UnauthorizedException();

      const tokenValid = await bcrypt.compare(dto.refreshToken, user.refresh_token_hash || '');
      if (!tokenValid) throw new UnauthorizedException('Refresh token invalid');

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  async logout(userId: string) {
    await this.supabase
      .from('users')
      .update({ refresh_token_hash: null })
      .eq('id', userId);
    return { message: 'Logged out' };
  }

  private async generateTokens(user: { id: string; role: string }) {
    const payload = { sub: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, token: string) {
    const hash = await bcrypt.hash(token, 10);
    await this.supabase.from('users').update({ refresh_token_hash: hash }).eq('id', userId);
  }
}
