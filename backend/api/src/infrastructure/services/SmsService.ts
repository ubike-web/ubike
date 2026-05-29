import AfricasTalking from 'africastalking';
import { env } from '../../config/env';

const at = AfricasTalking({
  apiKey: env.AFRICASTALKING_API_KEY,
  username: env.AFRICASTALKING_USERNAME,
});

const sms = at.SMS;

export class SmsService {
  async send(to: string, message: string): Promise<void> {
    const phone = to.startsWith('+') ? to : `+254${to.replace(/^0/, '')}`;
    await sms.send({
      to: [phone],
      message,
      from: env.AFRICASTALKING_SENDER_ID,
    });
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    await this.send(phone, `Your u-bike verification code is: ${otp}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`);
  }

  async sendRideAlert(phone: string, message: string): Promise<void> {
    await this.send(phone, `u-bike: ${message}`);
  }
}

export const smsService = new SmsService();
