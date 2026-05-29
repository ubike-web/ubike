import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { env } from '../../../config/env';
import { getSupabaseClient } from '../../../config/supabase';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { otpService } from '../../../infrastructure/services/OtpService';
import { AuthTokens, JwtPayload, UserRole } from '../../../shared/types';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors';
import { User } from '../../../domain/entities/User';

export class AuthService {
  private get db() { return getSupabaseClient(); }

  private generateTokens(user: User): AuthTokens {
    const payload: JwtPayload = { sub: user.id, role: user.role, phone: user.phone, email: user.email };
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
    return { accessToken, refreshToken, expiresIn: 7 * 24 * 3600 };
  }

  async sendPhoneOtp(phone: string): Promise<{ message: string }> {
    await otpService.sendPhoneOtp(phone);
    return { message: 'OTP sent successfully' };
  }

  async verifyPhoneOtp(phone: string, otp: string, role: UserRole = 'customer'): Promise<{ tokens: AuthTokens; user: User; isNew: boolean }> {
    await otpService.verifyPhoneOtp(phone, otp);

    let user = await userRepository.findByPhone(phone);
    let isNew = false;

    if (!user) {
      isNew = true;
      const referralCode = this.generateReferralCode();
      user = await userRepository.create({
        phone,
        role,
        full_name: `User_${phone.slice(-4)}`,
        referral_code: referralCode,
        is_active: true,
        is_verified: true,
        wallet_balance: 0,
        loyalty_points: 0,
      });

      // Create role profile
      if (role === 'customer') {
        await this.db.from('customer_profiles').insert({ user_id: user.id });
      } else if (role === 'passenger_rider' || role === 'errands_rider') {
        await this.db.from('rider_profiles').insert({
          user_id: user.id,
          rider_type: role === 'passenger_rider' ? 'passenger' : 'errands',
          is_available: false,
          is_kyc_verified: false,
          rating: 0,
          total_rides: 0,
          earnings_total: 0,
          earnings_pending: 0,
        });
      }
    }

    if (!user.is_active) throw new UnauthorizedError('Account is suspended');

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { tokens, user, isNew };
  }

  async registerWithEmail(email: string, password: string, fullName: string, role: UserRole = 'customer'): Promise<{ tokens: AuthTokens; user: User }> {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const referralCode = this.generateReferralCode();

    const user = await userRepository.create({
      email,
      password_hash: passwordHash as any,
      full_name: fullName,
      role,
      referral_code: referralCode,
      is_active: true,
      is_verified: false,
      wallet_balance: 0,
      loyalty_points: 0,
    });

    if (role === 'customer') {
      await this.db.from('customer_profiles').insert({ user_id: user.id });
    }

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { tokens, user };
  }

  async loginWithEmail(email: string, password: string): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const { data: profile } = await this.db.from('users').select('password_hash').eq('id', user.id).single();
    if (!profile?.password_hash) throw new UnauthorizedError('Invalid email or password');

    const valid = await bcrypt.compare(password, profile.password_hash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');
    if (!user.is_active) throw new UnauthorizedError('Account is suspended');

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { tokens, user };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const { data: stored } = await this.db
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', payload.sub)
      .eq('token', refreshToken)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!stored) throw new UnauthorizedError('Refresh token expired or revoked');

    const user = await userRepository.findById(payload.sub);
    if (!user.is_active) throw new UnauthorizedError('Account suspended');

    // Rotate token
    await this.db.from('refresh_tokens').update({ revoked: true }).eq('id', stored.id);

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.db.from('refresh_tokens').update({ revoked: true }).eq('token', refreshToken).eq('user_id', userId);
    } else {
      await this.db.from('refresh_tokens').update({ revoked: true }).eq('user_id', userId);
    }
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    await this.db.from('refresh_tokens').insert({ user_id: userId, token, expires_at: expiresAt, revoked: false });
  }

  private generateReferralCode(): string {
    return `UBK${uuid().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  }
}

export const authService = new AuthService();
