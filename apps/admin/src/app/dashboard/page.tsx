'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface Stats {
  totalUsers: number;
  activeRiders: number;
  totalRides: number;
  activeRides: number;
  totalErrands: number;
  totalRevenue: number;
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: '16px',
  padding: '20px',
  border: '1px solid #DDE8F0',
  boxShadow: '0 2px 8px rgba(14,134,202,0.06)',
};

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent: string }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: '#6B7A8D', fontWeight: 500 }}>{label}</span>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: '#0A1A3E' }}>{value}</div>
    </div>
  );
}

function QuickLink({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <a href={href} style={{
      display: 'block', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none',
      border: `1px solid ${color}30`, background: color + '0D',
      color, fontWeight: 600, fontSize: '13px', textAlign: 'center' as const,
      transition: 'all 0.15s ease',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = color + '20'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = color + '0D'; }}
    >
      {label}
    </a>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch(e => setError(e.response?.data?.error || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E3F4FD', borderTopColor: '#0E86CA', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#6B7A8D', fontSize: '14px' }}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px', color: '#DC2626' }}>{error}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0A1A3E', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#6B7A8D', fontSize: '14px', margin: '4px 0 0' }}>
          Welcome back, {user?.email?.split('@')[0] || 'Admin'}. Here's what's happening.
        </p>
      </div>

      {/* Hero revenue card */}
      <div style={{
        background: 'linear-gradient(135deg, #0A2D6E 0%, #0E86CA 60%, #42C8F5 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(14,134,202,0.3)',
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '0 0 6px', fontWeight: 500 }}>Total Revenue</p>
          <p style={{ color: '#fff', fontSize: '40px', fontWeight: 900, margin: 0, lineHeight: 1 }}>
            KES {stats?.totalRevenue?.toLocaleString() || '0'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '8px 0 0' }}>Platform earnings all time</p>
        </div>
        <div style={{ fontSize: '64px', opacity: 0.8 }}>💰</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Users"    value={stats?.totalUsers?.toLocaleString() || '0'} icon="👥" accent="#0E86CA" />
        <StatCard label="Online Riders"  value={stats?.activeRiders || 0}                   icon="🟢" accent="#16A34A" />
        <StatCard label="Total Rides"    value={stats?.totalRides?.toLocaleString() || '0'} icon="🏍" accent="#0E86CA" />
        <StatCard label="Active Rides"   value={stats?.activeRides || 0}                    icon="⚡" accent="#D97706" />
        <StatCard label="Total Errands"  value={stats?.totalErrands?.toLocaleString() || '0'} icon="📦" accent="#7C3AED" />
      </div>

      {/* Quick actions */}
      <div style={card}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0A1A3E', margin: '0 0 16px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          <QuickLink href="/dashboard/kyc"     label="🛡 Review KYC"     color="#0E86CA" />
          <QuickLink href="/dashboard/users"   label="👥 Manage Users"   color="#0A2D6E" />
          <QuickLink href="/dashboard/rides"   label="🏍 Live Rides"     color="#D97706" />
          <QuickLink href="/dashboard/reports" label="📊 Revenue Report" color="#16A34A" />
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ ...card }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0A1A3E', margin: '0 0 16px' }}>Platform Summary</h3>
          {[
            ['Total Rides', stats?.totalRides?.toLocaleString() || '0', '#0E86CA'],
            ['Total Errands', stats?.totalErrands?.toLocaleString() || '0', '#7C3AED'],
            ['Active Rides', stats?.activeRides || 0, '#D97706'],
            ['Online Riders', stats?.activeRiders || 0, '#16A34A'],
          ].map(([label, value, color]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #EEF4FB' }}>
              <span style={{ fontSize: '13px', color: '#6B7A8D' }}>{label}</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: color as string }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #F5FAFF, #E3F4FD)' }}>
          <div style={{ fontSize: '48px' }}>🏍</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#0E86CA' }}>{stats?.totalUsers || 0}</div>
          <div style={{ fontSize: '13px', color: '#6B7A8D' }}>Registered Users</div>
          <div style={{ marginTop: '8px', padding: '4px 14px', borderRadius: '20px', background: '#0E86CA', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
            {stats?.activeRiders || 0} riders online now
          </div>
        </div>
      </div>

    </div>
  );
}
