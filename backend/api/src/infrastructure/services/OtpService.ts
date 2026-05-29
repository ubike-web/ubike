import { getSupabaseClient } from '../../config/supabase';
import { env } from '../../config/env';
import { smsService } from './SmsService';
import { TooManyRequestsError, ValidationError } from '../../shared/errors';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class OtpService {
  private get db() { return getSupabaseClient(); }

  async sendPhoneOtp(phone: string): Promise<void> {
    const cooldown = await this.checkCooldown(phone);
    if (cooldown) {
      throw new TooManyRequestsError(`Please wait ${cooldown} seconds before requesting a new OTP`);
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Invalidate previous OTPs for this phone
    await this.db.from('otps').update({ used: true }).eq('phone', phone).eq('used', false);

    await this.db.from('otps').insert({
      phone,
      otp_hash: otp, // In production, hash with bcrypt
      expires_at: expiresAt,
      attempts: 0,
    });

    await smsService.sendOtp(phone, otp);
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
    const { data } = await this.db
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) throw new ValidationError('OTP expired or not found');

    if (data.attempts >= env.OTP_MAX_ATTEMPTS) {
      await this.db.from('otps').update({ used: true }).eq('id', data.id);
      throw new TooManyRequestsError('Too many failed attempts. Please request a new OTP');
    }

    if (data.otp_hash !== otp) {
      await this.db.from('otps').update({ attempts: data.attempts + 1 }).eq('id', data.id);
      throw new ValidationError('Invalid OTP');
    }

    await this.db.from('otps').update({ used: true }).eq('id', data.id);
    return true;
  }

  private async checkCooldown(phone: string): Promise<number | null> {
    const since = new Date(Date.now() - env.OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString();
    const { data } = await this.db
      .from('otps')
      .select('created_at')
      .eq('phone', phone)
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;
    const elapsed = (Date.now() - new Date(data.created_at).getTime()) / 1000;
    const remaining = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - elapsed);
    return remaining > 0 ? remaining : null;
  }
}

export const otpService = new OtpService();
