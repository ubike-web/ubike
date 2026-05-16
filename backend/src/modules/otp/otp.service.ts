import {
  Injectable, BadRequestException, Logger, TooManyRequestsException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly apiKey: string;
  private readonly username: string;
  private readonly env: string;
  private readonly expiryMinutes: number;
  private readonly maxAttempts: number;
  private readonly resendCooldown: number;

  constructor(private config: ConfigService, private supabase: SupabaseService) {
    this.apiKey = config.getOrThrow('AFRICASTALKING_API_KEY');
    this.username = config.getOrThrow('AFRICASTALKING_USERNAME');
    this.env = config.get('AFRICASTALKING_ENV', 'sandbox');
    this.expiryMinutes = config.get('OTP_EXPIRY_MINUTES', 5);
    this.maxAttempts = config.get('OTP_MAX_ATTEMPTS', 3);
    this.resendCooldown = config.get('OTP_RESEND_COOLDOWN_SECONDS', 60);
  }

  async sendOtp(phone: string, purpose: string): Promise<{ message: string }> {
    // Rate limiting — check last sent
    const { data: recent } = await this.supabase
      .from('otp_verifications')
      .select('created_at')
      .eq('phone', phone)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recent) {
      const elapsed = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
      if (elapsed < this.resendCooldown) {
        const wait = Math.ceil(this.resendCooldown - elapsed);
        throw new TooManyRequestsException(`Please wait ${wait}s before requesting another OTP`);
      }
    }

    const code = this.generateCode();
    const hashedCode = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    // Save OTP record
    await this.supabase.from('otp_verifications').insert({
      phone,
      purpose,
      code_hash: hashedCode,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      is_used: false,
    });

    // Send via Africa's Talking
    await this.sendSms(phone, `Your u-bike verification code is: ${code}. Valid for ${this.expiryMinutes} minutes. Do not share.`);

    this.logger.log(`OTP sent to ${this.maskPhone(phone)} for ${purpose}`);
    return { message: `OTP sent to ${this.maskPhone(phone)}` };
  }

  async verifyOtp(phone: string, code: string, purpose: string): Promise<boolean> {
    const { data: record } = await this.supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!record) throw new BadRequestException('OTP not found or expired');

    // Check max attempts
    if (record.attempts >= this.maxAttempts) {
      throw new BadRequestException('Too many failed attempts. Request a new OTP');
    }

    const isValid = this.hashCode(code) === record.code_hash;

    if (!isValid) {
      await this.supabase
        .from('otp_verifications')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id);
      return false;
    }

    // Mark as used
    await this.supabase
      .from('otp_verifications')
      .update({ is_used: true, verified_at: new Date().toISOString() })
      .eq('id', record.id);

    return true;
  }

  async sendSms(phone: string, message: string): Promise<void> {
    const baseUrl =
      this.env === 'sandbox'
        ? 'https://api.sandbox.africastalking.com'
        : 'https://api.africastalking.com';

    try {
      await axios.post(
        `${baseUrl}/version1/messaging`,
        new URLSearchParams({
          username: this.username,
          to: phone,
          message,
          from: this.config.get('AFRICASTALKING_SENDER_ID', 'UBIKE'),
        }),
        {
          headers: {
            apiKey: this.apiKey,
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    } catch (error: any) {
      this.logger.error(`SMS send failed: ${error.message}`);
      throw new BadRequestException('Failed to send SMS');
    }
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private maskPhone(phone: string): string {
    return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
  }
}
