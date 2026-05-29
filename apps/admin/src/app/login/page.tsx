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
    <div className="min-h-screen flex items-center justify-center bg-charcoal-500 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16 w-auto">
            <path d="M170 85C150 85 130 75 120 75M330 85C350 85 370 75 380 75" stroke="#BF9340" strokeWidth="6" strokeLinecap="round"/>
            <rect x="110" y="70" width="15" height="8" rx="2" fill="#BF9340"/>
            <rect x="375" y="70" width="15" height="8" rx="2" fill="#BF9340"/>
            <path d="M225 70C225 55 235 45 250 45C265 45 275 55 275 70L270 85C270 85 250 90 230 85L225 70Z" fill="#BF9340"/>
            <circle cx="250" cy="78" r="10" fill="white"/>
            <circle cx="250" cy="78" r="6" fill="#BF9340"/>
            <rect x="235" y="85" width="6" height="40" rx="1" fill="#BF9340"/>
            <rect x="259" y="85" width="6" height="40" rx="1" fill="#BF9340"/>
            <rect x="242" y="115" width="16" height="65" rx="4" fill="#BF9340"/>
            <text x="50" y="165" fontSize="80" fill="#BF9340" fontFamily="Poppins, sans-serif" fontWeight="bold">u-bike</text>
          </svg>
        </div>

        <div className="bg-charcoal-400 rounded-2xl p-8 border border-charcoal-300">
          <h1 className="text-xl font-semibold text-gold-500 mb-6 text-center">Admin Portal</h1>

          {error && (
            <div className="bg-sienna-500/20 border border-sienna-500 text-sienna-200 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-charcoal-600 border border-charcoal-300 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="admin@ubike.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-charcoal-600 border border-charcoal-300 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-charcoal-500 font-semibold rounded-lg py-2.5 transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
