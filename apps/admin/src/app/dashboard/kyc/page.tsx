'use client';

import { useEffect, useState } from 'react';
import { fetchKyc, approveKyc, rejectKyc } from '@/lib/api';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function KycPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchKyc(1, status)
      .then(d => setItems(d.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try { await approveKyc(userId); load(); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason) return;
    setActionLoading(rejectTarget);
    try {
      await rejectKyc(rejectTarget, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } finally { setActionLoading(null); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">KYC Review</h1>

      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${status === s ? 'bg-gold-500 text-charcoal-500' : 'bg-charcoal-400 text-gray-300 hover:bg-charcoal-300'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-400 border border-charcoal-300 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-3">Reason for rejection</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-charcoal-600 border border-charcoal-300 rounded-lg px-3 py-2 text-white text-sm mb-4 focus:outline-none focus:border-gold-500"
              rows={3}
              placeholder="e.g. Documents unclear, expired license..."
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 bg-charcoal-600 text-gray-300 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason} className="flex-1 bg-sienna-500 hover:bg-sienna-400 disabled:opacity-50 text-white rounded-lg py-2 text-sm">Reject</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-charcoal-400 border border-charcoal-300 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No {status} KYC requests</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-charcoal-600">
              <tr>
                {['Rider', 'Plate', 'Submitted', 'Documents', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={`border-t border-charcoal-300 ${i % 2 === 0 ? '' : 'bg-charcoal-600/30'}`}>
                  <td className="px-4 py-3 text-white">{(item.users as any)?.full_name || item.user_id}</td>
                  <td className="px-4 py-3 text-gray-300">{item.plate_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(item.submitted_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {[['License', item.license_url], ['ID', item.national_id_url], ['Vehicle', item.vehicle_photo_url]].map(([label, url]) => (
                        url && <a key={label as string} href={url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">
                          {label} <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(item.user_id)}
                          disabled={actionLoading === item.user_id}
                          className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                          title="Approve"
                        >
                          {actionLoading === item.user_id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => setRejectTarget(item.user_id)}
                          disabled={actionLoading === item.user_id}
                          className="p-1.5 rounded-lg text-sienna-400 hover:bg-sienna-500/20 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                    {status !== 'pending' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-sienna-500/20 text-sienna-400'}`}>
                        {status}
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
