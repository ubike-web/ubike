export interface Transaction {
  id: string;
  user_id: string;
  reference: string;
  type: TransactionType;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'reversed';
  gateway: 'paystack' | 'wallet';
  gateway_response?: string;
  metadata?: Record<string, unknown>;
  ride_id?: string;
  errand_id?: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType =
  | 'ride_payment'
  | 'errand_payment'
  | 'wallet_topup'
  | 'wallet_withdrawal'
  | 'rider_payout'
  | 'refund'
  | 'referral_bonus'
  | 'promo_credit';

export interface EscrowRecord {
  id: string;
  transaction_id: string;
  ride_id?: string;
  errand_id?: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  held_at: string;
  released_at?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}
