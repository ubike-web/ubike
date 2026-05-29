import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../config/env';

const http = axios.create({
  baseURL: env.PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface InitializePaymentParams {
  email: string;
  amount: number; // in kobo (multiply KES * 100)
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: string;
  reference: string;
  amount: number;
  paid_at: string;
  metadata?: Record<string, unknown>;
}

export class PaystackService {
  async initializePayment(params: InitializePaymentParams): Promise<PaystackInitResponse> {
    const { data } = await http.post('/transaction/initialize', {
      email: params.email,
      amount: Math.round(params.amount * 100), // convert to kobo
      reference: params.reference,
      metadata: params.metadata,
      callback_url: params.callback_url,
    });
    if (!data.status) throw new Error(data.message || 'Paystack initialization failed');
    return data.data;
  }

  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    const { data } = await http.get(`/transaction/verify/${reference}`);
    if (!data.status) throw new Error(data.message || 'Payment verification failed');
    return {
      status: data.data.status,
      reference: data.data.reference,
      amount: data.data.amount / 100,
      paid_at: data.data.paid_at,
      metadata: data.data.metadata,
    };
  }

  async refundTransaction(reference: string, amount?: number): Promise<void> {
    await http.post('/refund', {
      transaction: reference,
      ...(amount ? { amount: Math.round(amount * 100) } : {}),
    });
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!env.PAYSTACK_WEBHOOK_SECRET) return true; // skip if not configured
    const hash = crypto
      .createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }
}

export const paystackService = new PaystackService();
