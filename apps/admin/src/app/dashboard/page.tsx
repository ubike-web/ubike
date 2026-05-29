'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard } from '@/lib/api';
import { Users, Bike, Package, DollarSign, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeRiders: number;
  totalRides: number;
  activeRides: number;
  totalErrands: number;
  totalRevenue: number;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className={`bg-charcoal-400 border border-charcoal-300 rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch(e => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  if (error) {
    return <div className="text-sienna-400 bg-sienna-500/10 rounded-lg p-4">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={stats!.totalUsers?.toLocaleString()} icon={Users} color="bg-gold-500/20 text-gold-400" />
        <StatCard label="Online Riders" value={stats!.activeRiders} icon={Bike} color="bg-green-500/20 text-green-400" />
        <StatCard label="Total Rides" value={stats!.totalRides?.toLocaleString()} icon={Bike} color="bg-blue-500/20 text-blue-400" />
        <StatCard label="Active Rides" value={stats!.activeRides} icon={Bike} color="bg-yellow-500/20 text-yellow-400" />
        <StatCard label="Total Errands" value={stats!.totalErrands?.toLocaleString()} icon={Package} color="bg-purple-500/20 text-purple-400" />
        <StatCard label="Total Revenue" value={`KES ${stats!.totalRevenue?.toLocaleString()}`} icon={DollarSign} color="bg-sienna-500/20 text-sienna-300" />
      </div>

      <div className="bg-charcoal-400 border border-charcoal-300 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gold-400 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/kyc', label: 'Review KYC' },
            { href: '/dashboard/users', label: 'Manage Users' },
            { href: '/dashboard/rides', label: 'Live Rides' },
            { href: '/dashboard/reports', label: 'Revenue Report' },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              className="bg-charcoal-600 hover:bg-charcoal-300 border border-charcoal-300 rounded-lg px-4 py-3 text-sm text-center text-gray-300 hover:text-gold-400 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
