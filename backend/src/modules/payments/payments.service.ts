import {
  Injectable, BadRequestException, Logger, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { SupabaseService } from '../../database/supabase.service';
import { InitializePaymentDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paystackBase: string;
  private readonly paystackSecret: string;

  constructor(private config: ConfigService, private supabase: SupabaseService) {
    this.paystackBase = config.get('PAYSTACK_BASE_URL', 'https://api.paystack.co');
    this.paystackSecret = config.getOrThrow('PAYSTACK_SECRET_KEY');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.paystackSecret}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeWalletFunding(userId: string, dto: InitializePaymentDto) {
    const { data: user } = await this.supabase
      .from('users')
      .select('email, phone, full_name')
      .eq('id', userId)
      .single();

    const reference = `UBIKE-${userId.slice(0, 8)}-${Date.now()}`;

    const response = await axios.post(
      `${this.paystackBase}/transaction/initialize`,
      {
        email: user?.email || `${user?.phone?.replace('+', '')}@ubike.app`,
        amount: dto.amount * 100, // Paystack expects kobo/cents
        reference,
        currency: 'KES',
        metadata: {
          userId,
          purpose: 'wallet_funding',
          custom_fields: [
            { display_name: 'Platform', value: 'u-bike' },
            { display_name: 'User', value: user?.full_name },
          ],
        },
        callback_url: `${this.config.get('FRONTEND_URL')}/payment/callback`,
      },
      { headers: this.headers },
    );

    const { authorization_url, access_code, reference: ref } = response.data.data;

    // Save pending transaction
    await this.supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'wallet_funding',
      amount: dto.amount,
      status: 'pending',
      reference: ref,
      provider: 'paystack',
    });

    return { authorizationUrl: authorization_url, accessCode: access_code, reference: ref };
  }

  async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.paystackBase}/transaction/verify/${reference}`,
      { headers: this.headers },
    );

    return response.data.data;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.getOrThrow('PAYSTACK_WEBHOOK_SECRET');
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    if (hash !== signature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    this.logger.log(`Paystack webhook: ${event.event}`);

    switch (event.event) {
      case 'charge.success':
        await this.handleChargeSuccess(event.data);
        break;
      case 'transfer.success':
        await this.handleTransferSuccess(event.data);
        break;
      case 'transfer.failed':
        await this.handleTransferFailed(event.data);
        break;
      default:
        this.logger.debug(`Unhandled Paystack event: ${event.event}`);
    }

    return { received: true };
  }

  private async handleChargeSuccess(data: any) {
    const { reference, metadata, amount } = data;
    const amountKes = amount / 100;
    const userId = metadata?.userId;

    if (!userId || metadata?.purpose !== 'wallet_funding') return;

    // Check for duplicate processing
    const { data: tx } = await this.supabase
      .from('wallet_transactions')
      .select('id, status')
      .eq('reference', reference)
      .single();

    if (!tx || tx.status === 'success') return;

    await Promise.all([
      // Credit wallet
      this.supabase.rpc('credit_wallet', { p_user_id: userId, p_amount: amountKes }),
      // Update transaction record
      this.supabase
        .from('wallet_transactions')
        .update({ status: 'success', provider_reference: data.id })
        .eq('reference', reference),
    ]);

    this.logger.log(`Wallet funded: user=${userId} amount=${amountKes}`);
  }

  private async handleTransferSuccess(data: any) {
    const { reference } = data;
    await this.supabase
      .from('withdrawals')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('paystack_reference', reference);
  }

  private async handleTransferFailed(data: any) {
    const { reference, reason } = data;
    const { data: withdrawal } = await this.supabase
      .from('withdrawals')
      .select('user_id, amount')
      .eq('paystack_reference', reference)
      .single();

    if (!withdrawal) return;

    await Promise.all([
      // Refund the reserved amount
      this.supabase.rpc('credit_wallet', { p_user_id: withdrawal.user_id, p_amount: withdrawal.amount }),
      this.supabase
        .from('withdrawals')
        .update({ status: 'failed', failure_reason: reason })
        .eq('paystack_reference', reference),
    ]);
  }

  async initiateRiderPayout(withdrawalId: string) {
    const { data: withdrawal } = await this.supabase
      .from('withdrawals')
      .select('*, users(full_name)')
      .eq('id', withdrawalId)
      .eq('status', 'pending')
      .single();

    if (!withdrawal) throw new BadRequestException('Withdrawal not found or already processed');

    const reference = `WITHDRAW-${withdrawalId.slice(0, 8)}-${Date.now()}`;

    // Create Paystack transfer recipient
    const recipientRes = await axios.post(
      `${this.paystackBase}/transferrecipient`,
      {
        type: 'mobile_money',
        name: withdrawal.payout_name,
        account_number: withdrawal.payout_account.replace('+', ''),
        bank_code: 'MPESA', // Kenya M-Pesa
        currency: 'KES',
      },
      { headers: this.headers },
    );

    const recipientCode = recipientRes.data.data.recipient_code;

    // Initiate transfer
    await axios.post(
      `${this.paystackBase}/transfer`,
      {
        source: 'balance',
        amount: withdrawal.amount * 100,
        recipient: recipientCode,
        reason: `u-bike payout — ${withdrawal.users?.full_name}`,
        reference,
      },
      { headers: this.headers },
    );

    await this.supabase
      .from('withdrawals')
      .update({ status: 'processing', paystack_reference: reference })
      .eq('id', withdrawalId);

    return { message: 'Payout initiated', reference };
  }
}
