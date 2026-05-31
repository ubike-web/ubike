'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

const nav = [
  { href: '/dashboard',          label: 'Dashboard',   icon: '⊞' },
  { href: '/dashboard/users',    label: 'Users',        icon: '👥' },
  { href: '/dashboard/rides',    label: 'Rides',        icon: '🏍' },
  { href: '/dashboard/errands',  label: 'Errands',      icon: '📦' },
  { href: '/dashboard/payments', label: 'Payments',     icon: '💳' },
  { href: '/dashboard/kyc',      label: 'KYC Review',   icon: '🛡' },
  { href: '/dashboard/reports',  label: 'Reports',      icon: '📊' },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore(s => s.logout);
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #DDE8F0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      boxShadow: '2px 0 8px rgba(14,134,202,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #DDE8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, #0A2D6E, #0E86CA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 32 26" width="20" height="16">
            <path d="M4 20L8 4L24 4L28 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="3" cy="22" r="3" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="29" cy="22" r="3" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
        <div>
          <div style={{ color: '#0A2D6E', fontWeight: 900, fontSize: '16px', letterSpacing: '2px', lineHeight: 1 }}>U-BIKE</div>
          <div style={{ color: '#0E86CA', fontSize: '9px', letterSpacing: '2px', marginTop: '2px' }}>ADMIN</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || (pathname.startsWith(href + '/') && href !== '/dashboard');
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', marginBottom: '3px',
              textDecoration: 'none', fontSize: '13px', fontWeight: active ? 600 : 400,
              background: active ? '#E3F4FD' : 'transparent',
              color: active ? '#0E86CA' : '#6B7A8D',
              border: active ? '1px solid rgba(14,134,202,0.2)' : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #DDE8F0' }}>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: 'transparent', color: '#6B7A8D', fontSize: '13px',
          transition: 'all 0.15s ease',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B7A8D'; }}
        >
          <span style={{ fontSize: '16px' }}>🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
