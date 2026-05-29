'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Bike, Package, CreditCard, ShieldCheck, BarChart3, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/rides', label: 'Rides', icon: Bike },
  { href: '/dashboard/errands', label: 'Errands', icon: Package },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/kyc', label: 'KYC Review', icon: ShieldCheck },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore(s => s.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[#DDE8F0] flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#DDE8F0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 ocean-gradient rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-5 h-5">
              <path d="M8 22L12 10L20 10L24 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="6" cy="24" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="26" cy="24" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <div>
            <span className="text-[#0A2D6E] font-black text-lg leading-none">U-BIKE</span>
            <p className="text-[#6B7A8D] text-[10px] font-medium">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-[#E3F4FD] text-[#0E86CA] border border-[#0E86CA]/20 shadow-sm'
                : 'text-[#6B7A8D] hover:bg-[#F5FAFF] hover:text-[#0E86CA]',
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[#DDE8F0]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm text-[#6B7A8D] hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
