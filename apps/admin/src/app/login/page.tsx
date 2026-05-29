'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Ocean gradient */}
      <div className="hidden lg:flex w-1/2 ocean-gradient flex-col items-center justify-center p-12">
        {/* Logo */}
        <div className="text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/40">
            <svg viewBox="0 0 64 64" className="w-14 h-14">
              <path d="M20 36L28 18L36 18L44 36" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="16" cy="42" r="8" stroke="white" strokeWidth="2.5" fill="none"/>
              <circle cx="48" cy="42" r="8" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M28 18 L38 28 L44 36" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M40 26 L48 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Leaf */}
              <path d="M50 16 C56 10 60 12 58 18 C54 20 50 20 50 16Z" fill="#4CAF50"/>
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-widest mb-3">U-BIKE</h1>
          <p className="text-white/80 text-lg">Admin Portal</p>
          <div className="mt-8 space-y-3 text-left">
            {['Manage riders & customers', 'Monitor live rides & errands', 'KYC verification & approvals', 'Revenue & payout reports'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                </div>
                <span className="text-white/85 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — white login form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 ocean-gradient rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-black text-xl">U</span>
            </div>
            <h1 className="text-2xl font-black text-[#0A2D6E]">U-BIKE Admin</h1>
          </div>

          <h2 className="text-2xl font-bold text-[#0A1A3E] mb-2">Welcome back</h2>
          <p className="text-[#6B7A8D] text-sm mb-8">Sign in to your admin account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0A1A3E] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#F5FAFF] border border-[#DDE8F0] rounded-xl px-4 py-3 text-[#0A1A3E] focus:outline-none focus:border-[#0E86CA] focus:ring-2 focus:ring-[#0E86CA]/20 transition-all text-sm"
                placeholder="admin@ubike.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A1A3E] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#F5FAFF] border border-[#DDE8F0] rounded-xl px-4 py-3 text-[#0A1A3E] focus:outline-none focus:border-[#0E86CA] focus:ring-2 focus:ring-[#0E86CA]/20 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full ocean-gradient disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-all hover:shadow-lg hover:shadow-[#0E86CA]/30 mt-2 text-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[#6B7A8D] text-xs mt-6">
            u-bike Admin Portal v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
