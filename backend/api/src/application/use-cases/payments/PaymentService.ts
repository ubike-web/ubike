import { v4 as uuid } from 'uuid';
import { getSupabaseClient } from '../../../config/supabase';
import { paystackService } from '../../../infrastructure/services/PaystackService';
import { rideRepository } from '../../../infrastructure/repositories/RideRepository';
import { errandRepository } from '../../../infrastructure/repositories/ErrandRepository';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { socketGateway } from '../../../infrastructure/realtime/SocketGateway';
import { ValidationError, NotFoundError, ForbiddenError } from '../../../shared/errors';

export class PaymentService {
  private get db() { return getSupabaseClient(); }

  async initializeRidePayment(customerId: string, rideId: string, email: string): Promise<{ authorizationUrl: string; reference: string }> {
    const ride = await rideRepository.findById(rideId);
    if (ride.customer_id !== customerId) throw new ForbiddenError();
    if (ride.status !== 'completed') throw new ValidationError('Ride must be completed before payment');
    if (ride.payment_status !== 'pending') throw new ValidationError('Payment already processed');

    const reference = `RIDE-${uuid()}`;
    const amount = ride.fare_final || ride.fare_estimate;

    const result = await paystackService.initializePayment({
      email,
      amount,
      reference,
      metadata: { rideId, customerId, type: 'ride_payment' },
    });

    await this.db.from('transactions').insert({
      user_id: customerId,
      reference,
      type: 'ride_payment',
      amount,
      fee: 0,
      net_amount: amount,
      currency: 'KES',
      status: 'pending',
      gateway: 'paystack',
      ride_id: rideId,
    });

    // Escrow
    await this.db.from('escrow').insert({
      transaction_reference: reference,
      ride_id: rideId,
      amount,
      status: 'held',
      held_at: new Date().toISOString(),
    });

    return { authorizationUrl: result.authorization_url, reference };
  }

  async initializeErrandPayment(customerId: string, errandId: string, email: string): Promise<{ authorizationUrl: string; reference: string }> {
    const errand = await errandRepository.findById(errandId);
    if (errand.customer_id !== customerId) throw new ForbiddenError();
    if (errand.status !== 'delivered') throw new ValidationError('Errand must be delivered before payment');
    if (errand.payment_status !== 'pending') throw new ValidationError('Payment already processed');

    const reference = `ERRAND-${uuid()}`;
    const amount = errand.fare_final || errand.fare_estimate;

    const result = await paystackService.initializePayment({
      email,
      amount,
      reference,
      metadata: { errandId, customerId, type: 'errand_payment' },
    });

    await this.db.from('transactions').insert({
      user_id: customerId,
      reference,
      type: 'errand_payment',
      amount,
      fee: 0,
      net_amount: amount,
      currency: 'KES',
      status: 'pending',
      gateway: 'paystack',
      errand_id: errandId,
    });

    return { authorizationUrl: result.authorization_url, reference };
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    const valid = paystackService.verifyWebhookSignature(payload, signature);
    if (!valid) throw new ForbiddenError('Invalid webhook signature');

    const event = JSON.parse(payload);
    if (event.event !== 'charge.success') return;

    const { reference, metadata } = event.data;
    await this.processSuccessfulPayment(reference, metadata);
  }

  async verifyAndProcess(reference: string): Promise<void> {
    const result = await paystackService.verifyPayment(reference);
    if (result.status !== 'success') throw new ValidationError('Payment not successful');
    await this.processSuccessfulPayment(reference, result.metadata || {});
  }

  private async processSuccessfulPayment(reference: string, metadata: Record<string, unknown>): Promise<void> {
    const { data: tx } = await this.db.from('transactions').select('*').eq('reference', reference).single();
    if (!tx || tx.status === 'success') return;

    await this.db.from('transactions').update({ status: 'success', gateway_response: 'paid' }).eq('reference', reference);

    if (metadata.rideId) {
      await rideRepository.update(String(metadata.rideId), { payment_status: 'escrowed', payment_reference: reference });
      socketGateway.emitToUser(String(metadata.customerId), 'payment:confirmed', { type: 'ride', rideId: metadata.rideId });
    }

    if (metadata.errandId) {
      await errandRepository.update(String(metadata.errandId), { payment_status: 'escrowed', payment_reference: reference });
      socketGateway.emitToUser(String(metadata.customerId), 'payment:confirmed', { type: 'errand', errandId: metadata.errandId });
    }
  }

  async getWalletBalance(userId: string): Promise<number> {
    const user = await userRepository.findById(userId);
    return user.wallet_balance;
  }

  async getUserTransactions(userId: string, page: number, limit: number) {
    const from = (page - 1) * limit;
    const { data, count } = await this.db
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    return { data: data || [], total: count || 0 };
  }
}

export const paymentService = new PaymentService();
