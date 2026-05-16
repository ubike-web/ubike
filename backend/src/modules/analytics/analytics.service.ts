import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  async getRiderAnalytics(riderId: string, period: 'week' | 'month' | 'all' = 'week') {
    const from = this.getPeriodStart(period);

    const table = 'wallet_transactions';
    let query = this.supabase
      .from(table)
      .select('amount, created_at, type')
      .eq('user_id', riderId)
      .eq('type', 'earning');

    if (from) query = query.gte('created_at', from.toISOString());

    const { data: txns } = await query;

    const dailyMap = new Map<string, number>();
    for (const txn of txns ?? []) {
      const day = txn.created_at.slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + Number(txn.amount));
    }

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalEarnings = (txns ?? []).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalTrips = txns?.length ?? 0;

    return { totalEarnings, totalTrips, dailyBreakdown, period };
  }

  async getPlatformRevenueChart(days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await this.supabase
      .from('wallet_transactions')
      .select('amount, created_at')
      .eq('type', 'ride_payment')
      .gte('created_at', from);

    const dailyMap = new Map<string, number>();
    for (const txn of data ?? []) {
      const day = txn.created_at.slice(0, 10);
      const commission = Math.abs(Number(txn.amount)) * 0.2;
      dailyMap.set(day, (dailyMap.get(day) || 0) + commission);
    }

    return Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCustomerStats(customerId: string) {
    const [rides, errands, totalSpent] = await Promise.all([
      this.supabase.from('rides').select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId).eq('status', 'completed'),
      this.supabase.from('errands').select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId).eq('status', 'delivered'),
      this.supabase.from('wallet_transactions').select('amount')
        .eq('user_id', customerId).in('type', ['ride_payment', 'errand_payment']),
    ]);

    const spent = (totalSpent.data ?? []).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

    return {
      totalRides: rides.count ?? 0,
      totalErrands: errands.count ?? 0,
      totalSpentKes: Math.round(spent),
    };
  }

  private getPeriodStart(period: string): Date | null {
    const now = new Date();
    if (period === 'week') return new Date(now.setDate(now.getDate() - 7));
    if (period === 'month') return new Date(now.setMonth(now.getMonth() - 1));
    return null;
  }
}
