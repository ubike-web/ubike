'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard } from '@/lib/api';
import { Users, Bike, Package, DollarSign, Loader2, TrendingUp, Activity } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeRiders: number;
  totalRides: number;
  activeRides: number;
  totalErrands: number;
  totalRevenue: number;
}

function StatCard({ label, value, icon: Icon, color, bg, trend }: { label: string; value: string | number; icon: React.ElementType; color: string; bg: string; trend?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#DDE8F0] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#6B7A8D]">{label}</span>
        <div className={`p-2 rounded-xl ${bg}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#0A1A3E]">{value}</div>
      {trend && <div className="text-xs text-[#2E7D32] mt-1 flex items-center gap-1"><TrendingUp size={12} />{trend}</div>}
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-[#0E86CA]" size={32} />
    </div>
  );

  if (error) return <div className="text-red-600 bg-red-50 rounded-xl p-4 border border-red-200">{error}</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A1A3E]">Dashboard</h1>
        <p className="text-[#6B7A8D] text-sm mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Hero metric */}
      <div className="ocean-gradient rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-4xl font-black">KES {stats!.totalRevenue?.toLocaleString()}</p>
            <p className="text-white/70 text-xs mt-2">Platform earnings all time</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <DollarSign size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={stats!.totalUsers?.toLocaleString()} icon={Users} color="text-[#0E86CA]" bg="bg-[#E3F4FD]" trend="+12% this week" />
        <StatCard label="Online Riders" value={stats!.activeRiders} icon={Activity} color="text-[#2E7D32]" bg="bg-green-50" />
        <StatCard label="Total Rides" value={stats!.totalRides?.toLocaleString()} icon={Bike} color="text-[#0E86CA]" bg="bg-[#E3F4FD]" />
        <StatCard label="Active Rides" value={stats!.activeRides} icon={Bike} color="text-[#F57C00]" bg="bg-orange-50" />
        <StatCard label="Total Errands" value={stats!.totalErrands?.toLocaleString()} icon={Package} color="text-[#6A1B9A]" bg="bg-purple-50" />
        <StatCard label="Riders Online" value={stats!.activeRiders} icon={Users} color="text-[#2E7D32]" bg="bg-green-50" />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-5 border border-[#DDE8F0]">
        <h2 className="text-base font-semibold text-[#0A1A3E] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/kyc', label: 'Review KYC', color: 'text-[#0E86CA] bg-[#E3F4FD] border-[#0E86CA]/20' },
            { href: '/dashboard/users', label: 'Manage Users', color: 'text-[#0A2D6E] bg-blue-50 border-blue-200' },
            { href: '/dashboard/rides', label: 'Live Rides', color: 'text-[#F57C00] bg-orange-50 border-orange-200' },
            { href: '/dashboard/reports', label: 'Revenue Report', color: 'text-[#2E7D32] bg-green-50 border-green-200' },
          ].map(l => (
            <a key={l.href} href={l.href}
              className={`border rounded-xl px-4 py-3 text-sm text-center font-medium transition-all hover:shadow-md ${l.color}`}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
