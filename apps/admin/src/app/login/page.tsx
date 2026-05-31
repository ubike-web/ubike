'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] p-4">
      <style>{`
        @property --a {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes spin-border {
          0%   { --a: 0deg; }
          100% { --a: 360deg; }
        }
        .spin-box {
          position: relative;
          background: repeating-conic-gradient(
            from var(--a),
            #0E86CA 0%, #0E86CA 5%,
            transparent 5%, transparent 40%,
            #0E86CA 50%
          );
          border-radius: 20px;
          animation: spin-border 4s linear infinite;
          filter: drop-shadow(0 15px 40px rgba(14,134,202,0.3));
        }
        .spin-box::before {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-conic-gradient(
            from var(--a),
            #42C8F5 0%, #42C8F5 5%,
            transparent 5%, transparent 40%,
            #42C8F5 50%
          );
          border-radius: 20px;
          animation: spin-border 4s linear infinite;
          animation-delay: -1s;
          filter: drop-shadow(0 0 8px #42C8F5);
        }
        .spin-box::after {
          content: "";
          position: absolute;
          inset: 4px;
          background: #0A1A2E;
          border-radius: 16px;
          border: 8px solid #0D1B2A;
        }
        .spin-box:hover .login-inner { inset: 32px; }
        .spin-box:hover .login-content { transform: translateY(0); }
        .login-inner {
          position: absolute;
          inset: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border-radius: 12px;
          background: rgba(0,0,0,0.2);
          z-index: 10;
          box-shadow: inset 0 10px 20px rgba(0,0,0,0.5);
          border-bottom: 2px solid rgba(255,255,255,0.15);
          transition: all 0.5s ease;
          overflow: hidden;
        }
        .login-content {
          width: 76%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transform: translateY(120px);
          transition: transform 0.5s ease;
        }
        .spin-box { width: 420px; height: 200px; transition: all 0.5s ease; }
        .spin-box:hover { height: 520px; }
      `}</style>

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Logo above the box */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0A2D6E, #0E86CA, #42C8F5)'}}>
            <svg viewBox="0 0 40 32" className="w-10 h-8">
              <path d="M8 24L12 8L28 8L32 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="5" cy="27" r="4.5" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="35" cy="27" r="4.5" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M12 8L20 16L28 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              {/* Leaf */}
              <path d="M33 6 C38 1 41 4 39 9 C35 10 32 9 33 6Z" fill="#4CAF50"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-white font-black text-2xl tracking-[6px]">U-BIKE</h1>
            <p className="text-[#42C8F5] text-xs tracking-[3px] mt-0.5">ADMIN PORTAL</p>
          </div>
        </div>

        {/* Spinning border box */}
        <div className="spin-box">
          <div className="login-inner">
            <div className="login-content">
              <div className="text-center">
                <h2 className="text-white text-sm font-bold tracking-[3px] uppercase">Sign In</h2>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-5 py-2.5 rounded-full text-sm text-white outline-none"
                  style={{background: 'rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '14px', fontFamily: 'Poppins'}}
                />
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-5 py-2.5 rounded-full text-sm outline-none"
                    style={{background: 'rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '14px', fontFamily: 'Poppins'}}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs">
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>

                {error && (
                  <p className="text-[#FF7096] text-xs text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-full font-bold text-sm transition-all disabled:opacity-60"
                  style={{background: '#42C8F5', color: '#0A1A2E', fontSize: '14px', fontFamily: 'Poppins', boxShadow: '0 0 0px #42C8F5'}}
                  onMouseEnter={e => (e.target as any).style.boxShadow = '0 0 20px #42C8F5, 0 0 60px #42C8F5'}
                  onMouseLeave={e => (e.target as any).style.boxShadow = '0 0 0px #42C8F5'}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="flex justify-between text-xs">
                  <button type="button" className="text-white/50 hover:text-white/80 transition-colors">Forgot Password</button>
                  <span className="text-[#FF7096] font-bold">Admin Only</span>
                </div>
              </form>
            </div>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center">u-bike Admin Portal v1.0 · Secure Access</p>
      </div>
    </div>
  );
}
