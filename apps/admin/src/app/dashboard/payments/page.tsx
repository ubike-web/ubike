'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const S = {
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #DDE8F0', boxShadow: '0 2px 8px rgba(14,134,202,0.06)', overflow: 'hidden' } as React.CSSProperties,
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#6B7A8D', background: '#F5FAFF', borderBottom: '1px solid #DDE8F0' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#0A1A3E', borderBottom: '1px solid #EEF4FB' },
  chip: (active: boolean) => ({ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: active ? '#0E86CA' : '#F0F7FF', color: active ? '#fff' : '#6B7A8D' }),
};

const TYPE_ICONS: Record<string, string> = {
  ride_payment: '🏍', errand_payment: '📦', wallet_topup: '💳',
  wallet_withdrawal: '💸', rider_payout: '💰', refund: '↩️',
  referral_bonus: '🎁', promo_credit: '🏷',
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalTransactions: 0 });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/reports/revenue'),
      api.get('/admin/rides', { params: { page: 1, limit: 1 } }),
    ]).then(([rev, _]) => {
      const r = (rev.data as any).data;
      setSummary({ totalRevenue: r?.total || 0, totalTransactions: Object.values(r?.breakdown || {}).length });
    }).catch(() => {});

    // For now load from rides payment data (transactions endpoint needs admin scope)
    api.get('/admin/rides', { params: { page, limit: 20 } })
      .then((d: any) => {
        const data = d.data?.data || [];
        setTransactions(data.filter((r: any) => r.payment_status !== 'pending'));
        setTotal(d.data?.meta?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0A1A3E', marginBottom: '20px' }}>Payments</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Revenue', value: `KES ${summary.totalRevenue.toLocaleString()}`, icon: '💰', color: '#0E86CA' },
          { label: 'Escrow (Held)', value: 'KES —', icon: '🔒', color: '#7C3AED' },
          { label: 'Commission Rate', value: '20%', icon: '📊', color: '#D97706' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #DDE8F0', boxShadow: '0 2px 8px rgba(14,134,202,0.06)', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ fontSize: '32px' }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7A8D', marginBottom: '4px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #DDE8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0A1A3E' }}>Recent Paid Rides</h2>
          <a href="/dashboard/reports" style={{ fontSize: '13px', color: '#0E86CA', textDecoration: 'none', fontWeight: 500 }}>View Reports →</a>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#0E86CA' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Type', 'Route', 'Amount', 'Payment', 'Date'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={S.td}>🏍 Ride</td>
                  <td style={{ ...S.td, fontSize: '12px', color: '#6B7A8D', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.pickup_address} → {t.dropoff_address}
                  </td>
                  <td style={{ ...S.td, fontWeight: 700, color: '#0E86CA' }}>KES {t.fare_final || t.fare_estimate}</td>
                  <td style={S.td}>
                    <span style={{
                      background: t.payment_status === 'released' ? '#F0FDF4' : t.payment_status === 'escrowed' ? '#EFF6FF' : '#F5FAFF',
                      color: t.payment_status === 'released' ? '#16A34A' : t.payment_status === 'escrowed' ? '#2563EB' : '#6B7A8D',
                      padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    }}>
                      {t.payment_status}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: '#6B7A8D', fontSize: '12px' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button style={S.chip(false)} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: '13px', color: '#6B7A8D' }}>{page} / {totalPages}</span>
          <button style={S.chip(false)} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
