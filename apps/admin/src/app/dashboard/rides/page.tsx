'use client';

import { useEffect, useState } from 'react';
import { fetchRides } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-blue-500/20 text-blue-400',
  rider_arrived: 'bg-purple-500/20 text-purple-400',
  in_progress: 'bg-green-500/20 text-green-400',
  completed: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-sienna-500/20 text-sienna-400',
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
      .then(d => { setRides(d.data); setTotal(d.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, status]);

  const statuses = ['', 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Rides</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${status === s ? 'bg-gold-500 text-charcoal-500' : 'bg-charcoal-400 text-gray-300 hover:bg-charcoal-300'}`}
          >
            {s || 'All'}
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
                {['Pickup', 'Dropoff', 'Distance', 'Fare', 'Status', 'Type', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rides.map((r, i) => (
                <tr key={r.id} className={`border-t border-charcoal-300 ${i % 2 === 0 ? '' : 'bg-charcoal-600/30'}`}>
                  <td className="px-4 py-3 text-white max-w-[180px] truncate">{r.pickup_address}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">{r.dropoff_address}</td>
                  <td className="px-4 py-3 text-gray-300">{r.distance_km}km</td>
                  <td className="px-4 py-3 text-gold-400">KES {r.fare_final || r.fare_estimate}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{r.vehicle_type}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-charcoal-400 text-gray-300 rounded-lg text-sm disabled:opacity-50">Previous</button>
          <span className="px-3 py-1.5 text-gray-400 text-sm">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-charcoal-400 text-gray-300 rounded-lg text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
