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
    <aside className="w-64 min-h-screen bg-charcoal-600 border-r border-charcoal-300 flex flex-col">
      <div className="px-6 py-5 border-b border-charcoal-300">
        <span className="text-gold-500 font-bold text-xl">u-bike</span>
        <span className="text-gray-400 text-xs ml-2 font-medium">Admin</span>
      </div>

      <nav className="flex-1 py-4 px-3">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'text-gray-400 hover:bg-charcoal-400 hover:text-white',
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-charcoal-300">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm text-gray-400 hover:bg-sienna-500/20 hover:text-sienna-300 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
