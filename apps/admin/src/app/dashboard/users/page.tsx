'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, suspendUser, activateUser } from '@/lib/api';

const S = {
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #DDE8F0', boxShadow: '0 2px 8px rgba(14,134,202,0.06)', overflow: 'hidden' } as React.CSSProperties,
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#6B7A8D', background: '#F5FAFF', borderBottom: '1px solid #DDE8F0' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#0A1A3E', borderBottom: '1px solid #EEF4FB' },
  badge: (color: string) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: color === 'green' ? '#E8F5E9' : '#FEECEC', color: color === 'green' ? '#2E7D32' : '#DC2626' }),
  chip: (active: boolean) => ({ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: active ? '#0E86CA' : '#F0F7FF', color: active ? '#fff' : '#6B7A8D', transition: 'all 0.15s' }),
  btn: (danger?: boolean) => ({ padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: danger ? '#FEF2F2' : '#E8F5E9', color: danger ? '#DC2626' : '#2E7D32' }),
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchUsers(page, 20, role || undefined)
      .then((d: any) => { setUsers(d.data || []); setTotal(d.meta?.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, role]);

  const handleToggle = async (id: string, active: boolean) => {
    setActionId(id);
    try { active ? await suspendUser(id) : await activateUser(id); load(); }
    finally { setActionId(null); }
  };

  const roles = ['', 'customer', 'passenger_rider', 'errands_rider', 'admin'];
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0A1A3E', marginBottom: '20px' }}>Users</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {roles.map(r => (
          <button key={r} style={S.chip(role === r)} onClick={() => { setRole(r); setPage(1); }}>
            {r || 'All'}
          </button>
        ))}
      </div>

      <div style={S.card}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#0E86CA' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Contact', 'Role', 'Status', 'Joined', 'Action'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={S.td}><strong>{u.full_name || '—'}</strong></td>
                  <td style={S.td}>{u.email || u.phone}</td>
                  <td style={S.td}><span style={{ background: '#E3F4FD', color: '#0E86CA', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>{u.role}</span></td>
                  <td style={S.td}><span style={S.badge(u.is_active ? 'green' : 'red')}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                  <td style={{ ...S.td, color: '#6B7A8D' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={S.td}>
                    <button style={S.btn(u.is_active)} onClick={() => handleToggle(u.id, u.is_active)} disabled={actionId === u.id}>
                      {actionId === u.id ? '...' : u.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
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
