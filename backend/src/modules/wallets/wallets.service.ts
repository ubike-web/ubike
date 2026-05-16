import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { WithdrawalDto } from './dto/wallets.dto';

@Injectable()
export class WalletsService {
  constructor(private supabase: SupabaseService) {}

  async getWallet(userId: string) {
    const { data, error } = await this.supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Wallet not found');
    return data;
  }

  async getTransactionHistory(userId: string, limit = 30, offset = 0) {
    const { data } = await this.supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return data ?? [];
  }

  async requestWithdrawal(userId: string, dto: WithdrawalDto) {
    const wallet = await this.getWallet(userId);

    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const MIN_WITHDRAWAL = 100;
    if (dto.amount < MIN_WITHDRAWAL) {
      throw new BadRequestException(`Minimum withdrawal is KES ${MIN_WITHDRAWAL}`);
    }

    // Check no pending withdrawal
    const { data: pending } = await this.supabase
      .from('withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (pending) throw new BadRequestException('You have a pending withdrawal request');

    const { data: withdrawal, error } = await this.supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: dto.amount,
        payout_method: dto.payoutMethod,
        payout_account: dto.payoutAccount,
        payout_name: dto.payoutName,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Reserve amount in wallet
    await this.supabase.rpc('reserve_withdrawal', {
      p_user_id: userId,
      p_amount: dto.amount,
    });

    return withdrawal;
  }

  async getWithdrawals(userId: string) {
    const { data } = await this.supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data ?? [];
  }
}
