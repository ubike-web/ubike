'use client';

import { useEffect, useState } from 'react';
import { fetchRevenue } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    setLoading(true);
    fetchRevenue(from || undefined, to || undefined)
      .then(setRevenue)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const LABELS: Record<string, string> = {
    ride_payment: 'Ride Payments',
    errand_payment: 'Errand Payments',
    wallet_topup: 'Wallet Top-ups',
    refund: 'Refunds',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Revenue Report</h1>

      <div className="flex gap-3 mb-6 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-charcoal-400 border border-charcoal-300 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-charcoal-400 border border-charcoal-300 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500" />
        </div>
        <button onClick={load} className="bg-gold-500 hover:bg-gold-400 text-charcoal-500 font-semibold px-4 py-2 rounded-lg text-sm">Apply</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
      ) : revenue && (
        <div className="space-y-4">
          <div className="bg-charcoal-400 border border-charcoal-300 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-gold-400">KES {revenue.total?.toLocaleString()}</div>
          </div>

          <div className="bg-charcoal-400 border border-charcoal-300 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(revenue.breakdown || {}).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{LABELS[type] || type}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-charcoal-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-500 rounded-full"
                        style={{ width: `${Math.min(100, ((amount as number) / (revenue.total || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-gold-400 font-medium text-sm w-24 text-right">KES {(amount as number).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
