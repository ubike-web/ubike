'use client';

import { useEffect, useState } from 'react';
import { fetchRides } from '@/lib/api';

const S = {
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #DDE8F0', boxShadow: '0 2px 8px rgba(14,134,202,0.06)', overflow: 'hidden' } as React.CSSProperties,
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#6B7A8D', background: '#F5FAFF', borderBottom: '1px solid #DDE8F0' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#0A1A3E', borderBottom: '1px solid #EEF4FB' },
  chip: (active: boolean) => ({ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: active ? '#0E86CA' : '#F0F7FF', color: active ? '#fff' : '#6B7A8D' }),
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  requested:      { bg: '#FFF9E6', color: '#D97706' },
  accepted:       { bg: '#EFF6FF', color: '#2563EB' },
  rider_arrived:  { bg: '#F5F3FF', color: '#7C3AED' },
  in_progress:    { bg: '#ECFDF5', color: '#059669' },
  completed:      { bg: '#F0FDF4', color: '#16A34A' },
  cancelled:      { bg: '#FEF2F2', color: '#DC2626' },
  fare_negotiation: { bg: '#FFF7ED', color: '#EA580C' },
};

export default function RidesPage() {
  const [rides, setRides] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRides(page, 20, status || undefined)
      .then((d: any) => { setRides(d.data || []); setTotal(d.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, status]);

  const statuses = ['', 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0A1A3E', marginBottom: '20px' }}>Rides</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} style={S.chip(status === s)} onClick={() => { setStatus(s); setPage(1); }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={S.card}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#0E86CA' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Pickup', 'Dropoff', 'Distance', 'Fare', 'Status', 'Vehicle', 'Date'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rides.map(r => {
                const sc = STATUS_COLORS[r.status] || { bg: '#F5FAFF', color: '#6B7A8D' };
                return (
                  <tr key={r.id}>
                    <td style={{ ...S.td, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.pickup_address}</td>
                    <td style={{ ...S.td, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7A8D' }}>{r.dropoff_address}</td>
                    <td style={S.td}>{r.distance_km}km</td>
                    <td style={{ ...S.td, color: '#0E86CA', fontWeight: 600 }}>KES {r.fare_final || r.fare_estimate}</td>
                    <td style={S.td}><span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>{r.status}</span></td>
                    <td style={{ ...S.td, color: '#6B7A8D', textTransform: 'capitalize' }}>{r.vehicle_type}</td>
                    <td style={{ ...S.td, color: '#6B7A8D' }}>{new Date(r.created_at).toLocaleDateString()}</td>
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
