'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, suspendUser, activateUser } from '@/lib/api';
import { Loader2, UserX, UserCheck } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchUsers(page, 20, role || undefined)
      .then(d => { setUsers(d.data); setTotal(d.meta?.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, role]);

  const handleSuspend = async (id: string, active: boolean) => {
    setActionLoading(id);
    try {
      if (active) await suspendUser(id);
      else await activateUser(id);
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Users</h1>

      <div className="flex gap-3 mb-4">
        {['', 'customer', 'passenger_rider', 'errands_rider', 'admin'].map(r => (
          <button
            key={r}
            onClick={() => { setRole(r); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${role === r ? 'bg-gold-500 text-charcoal-500' : 'bg-charcoal-400 text-gray-300 hover:bg-charcoal-300'}`}
          >
            {r || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-charcoal-400 border border-charcoal-300 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-charcoal-600">
              <tr>
                {['Name', 'Contact', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-t border-charcoal-300 ${i % 2 === 0 ? '' : 'bg-charcoal-600/30'}`}>
                  <td className="px-4 py-3 text-white font-medium">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{u.email || u.phone}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gold-500/20 text-gold-400 text-xs px-2 py-0.5 rounded-full">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-sienna-500/20 text-sienna-400'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSuspend(u.id, u.is_active)}
                      disabled={actionLoading === u.id}
                      className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-sienna-400 hover:bg-sienna-500/20' : 'text-green-400 hover:bg-green-500/20'}`}
                      title={u.is_active ? 'Suspend' : 'Activate'}
                    >
                      {actionLoading === u.id ? <Loader2 size={16} className="animate-spin" /> : u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-charcoal-400 text-gray-300 rounded-lg text-sm disabled:opacity-50">
            Previous
          </button>
          <span className="px-3 py-1.5 text-gray-400 text-sm">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-charcoal-400 text-gray-300 rounded-lg text-sm disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
