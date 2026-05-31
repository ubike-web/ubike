'use client';

import { useEffect, useState } from 'react';
import { fetchKyc, approveKyc, rejectKyc } from '@/lib/api';

const S = {
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #DDE8F0', boxShadow: '0 2px 8px rgba(14,134,202,0.06)', overflow: 'hidden' } as React.CSSProperties,
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#6B7A8D', background: '#F5FAFF', borderBottom: '1px solid #DDE8F0' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#0A1A3E', borderBottom: '1px solid #EEF4FB' },
  chip: (active: boolean) => ({ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: active ? '#0E86CA' : '#F0F7FF', color: active ? '#fff' : '#6B7A8D' }),
};

export default function KycPage() {
  const [items, setItems] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    fetchKyc(1, kycStatus).then((d: any) => setItems(d.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [kycStatus]);

  const handleApprove = async (userId: string) => {
    setActionId(userId);
    try { await approveKyc(userId); load(); } finally { setActionId(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason) return;
    setActionId(rejectTarget);
    try { await rejectKyc(rejectTarget, rejectReason); setRejectTarget(null); setRejectReason(''); load(); } finally { setActionId(null); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0A1A3E', marginBottom: '20px' }}>KYC Review</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} style={S.chip(kycStatus === s)} onClick={() => setKycStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#0A1A3E', fontWeight: 700, marginBottom: '12px' }}>Reason for rejection</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              style={{ width: '100%', borderRadius: '10px', border: '1px solid #DDE8F0', padding: '10px', fontSize: '13px', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. Documents unclear, expired license..." />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #DDE8F0', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#0E86CA' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>No {kycStatus} KYC requests</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Rider', 'Plate', 'Submitted', 'Documents', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={S.td}>{(item.users as any)?.full_name || item.user_id}</td>
                  <td style={S.td}>{item.plate_number || '—'}</td>
                  <td style={{ ...S.td, color: '#6B7A8D' }}>{new Date(item.submitted_at).toLocaleDateString()}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[['License', item.license_url], ['ID', item.national_id_url], ['Vehicle', item.vehicle_photo_url]].map(([label, url]) =>
                        url ? <a key={label as string} href={url as string} target="_blank" rel="noopener noreferrer" style={{ color: '#0E86CA', fontSize: '12px' }}>{label} ↗</a> : null
                      )}
                    </div>
                  </td>
                  <td style={S.td}>
                    {kycStatus === 'pending' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleApprove(item.user_id)} disabled={actionId === item.user_id}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#E8F5E9', color: '#2E7D32', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          {actionId === item.user_id ? '...' : '✓ Approve'}
                        </button>
                        <button onClick={() => setRejectTarget(item.user_id)}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ background: kycStatus === 'approved' ? '#E8F5E9' : '#FEF2F2', color: kycStatus === 'approved' ? '#2E7D32' : '#DC2626', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                        {kycStatus}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
