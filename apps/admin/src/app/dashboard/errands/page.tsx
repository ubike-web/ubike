'use client';

import { useEffect, useState } from 'react';
import { fetchErrands } from '@/lib/api';

const S = {
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #DDE8F0', boxShadow: '0 2px 8px rgba(14,134,202,0.06)', overflow: 'hidden' } as React.CSSProperties,
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#6B7A8D', background: '#F5FAFF', borderBottom: '1px solid #DDE8F0' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#0A1A3E', borderBottom: '1px solid #EEF4FB' },
  chip: (active: boolean) => ({ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: active ? '#0E86CA' : '#F0F7FF', color: active ? '#fff' : '#6B7A8D' }),
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  requested:  { bg: '#FFF9E6', color: '#D97706' },
  accepted:   { bg: '#EFF6FF', color: '#2563EB' },
  picked_up:  { bg: '#F5F3FF', color: '#7C3AED' },
  in_transit: { bg: '#ECFDF5', color: '#059669' },
  delivered:  { bg: '#F0FDF4', color: '#16A34A' },
  cancelled:  { bg: '#FEF2F2', color: '#DC2626' },
};

const CATEGORY_ICONS: Record<string, string> = {
  shopping: '🛒', food_delivery: '🍔', parcel_delivery: '📦',
  document_delivery: '📄', pharmacy: '💊', bill_payment: '🧾',
  laundry: '👕', other: '📋',
};

export default function ErrandsPage() {
  const [errands, setErrands] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchErrands(page, 20, status || undefined)
      .then((d: any) => { setErrands(d.data || []); setTotal(d.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, status]);

  const statuses = ['', 'requested', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0A1A3E', marginBottom: '20px' }}>Errands & Deliveries</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} style={S.chip(status === s)} onClick={() => { setStatus(s); setPage(1); }}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div style={S.card}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#0E86CA' }}>Loading...</div>
        ) : errands.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>No errands found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Category', 'Description', 'Pickup', 'Dropoff', 'Fare', 'Status', 'Date'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {errands.map(e => {
                const sc = STATUS_COLORS[e.status] || { bg: '#F5FAFF', color: '#6B7A8D' };
                return (
                  <tr key={e.id}>
                    <td style={S.td}>
                      <span style={{ fontSize: '18px', marginRight: '6px' }}>{CATEGORY_ICONS[e.category] || '📋'}</span>
                      <span style={{ fontSize: '12px', color: '#6B7A8D', textTransform: 'capitalize' }}>{e.category?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ ...S.td, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                    <td style={{ ...S.td, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7A8D', fontSize: '12px' }}>{e.pickup_address}</td>
                    <td style={{ ...S.td, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7A8D', fontSize: '12px' }}>{e.dropoff_address}</td>
                    <td style={{ ...S.td, color: '#0E86CA', fontWeight: 600 }}>KES {e.fare_final || e.fare_estimate}</td>
                    <td style={S.td}>
                      <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                        {e.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#6B7A8D', fontSize: '12px' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
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
