'use client';

import { useEffect, useState } from 'react';
import { fetchRevenue } from '@/lib/api';

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    setLoading(true);
    fetchRevenue(from || undefined, to || undefined).then(setRevenue).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const LABELS: Record<string, string> = {
    ride_payment: 'Ride Payments', errand_payment: 'Errand Payments',
    wallet_topup: 'Wallet Top-ups', refund: 'Refunds',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '10px', border: '1px solid #DDE8F0',
    fontSize: '13px', outline: 'none', color: '#0A1A3E', background: '#F5FAFF',
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0A1A3E', marginBottom: '20px' }}>Revenue Report</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6B7A8D', marginBottom: '4px' }}>From</div>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6B7A8D', marginBottom: '4px' }}>To</div>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={load} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: '#0E86CA', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
          Apply
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#0E86CA' }}>Loading...</div>
      ) : revenue && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Total */}
          <div style={{ background: 'linear-gradient(135deg, #0A2D6E, #0E86CA)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginBottom: '4px' }}>Total Revenue</div>
              <div style={{ color: '#fff', fontSize: '36px', fontWeight: 800 }}>KES {revenue.total?.toLocaleString()}</div>
            </div>
            <div style={{ fontSize: '48px' }}>💰</div>
          </div>

          {/* Breakdown */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #DDE8F0', padding: '24px', boxShadow: '0 2px 8px rgba(14,134,202,0.06)' }}>
            <h2 style={{ color: '#0A1A3E', fontWeight: 700, marginBottom: '16px', fontSize: '16px' }}>Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(revenue.breakdown || {}).map(([type, amount]) => {
                const pct = Math.min(100, ((amount as number) / (revenue.total || 1)) * 100);
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '140px', fontSize: '13px', color: '#6B7A8D', flexShrink: 0 }}>{LABELS[type] || type}</div>
                    <div style={{ flex: 1, height: '8px', background: '#EEF4FB', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#0E86CA', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ width: '120px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#0E86CA' }}>
                      KES {(amount as number).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
