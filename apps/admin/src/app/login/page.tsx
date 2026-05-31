'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [angle, setAngle] = useState(0);
  const login = useAuthStore(s => s.login);
  const router = useRouter();

  // Animate the spinning border with requestAnimationFrame
  useEffect(() => {
    let frame: number;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 16) { // ~60fps
        setAngle(a => (a + 0.8) % 360);
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

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

  const deg = angle;
  const borderStyle = {
    background: `conic-gradient(from ${deg}deg, #0E86CA, #42C8F5, #0A2D6E, #0E86CA, #42C8F5, #0A2D6E, #0E86CA)`,
    padding: '3px',
    borderRadius: '20px',
    boxShadow: `0 0 30px rgba(14,134,202,0.4), 0 0 60px rgba(66,200,245,0.15)`,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #040F26 0%, #0A2D6E 40%, #0E86CA 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #0A2D6E, #0E86CA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(14,134,202,0.4)',
          }}>
            <svg viewBox="0 0 44 36" width="32" height="28">
              <path d="M6 28L12 6L32 6L38 28" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <circle cx="4" cy="30" r="4" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="40" cy="30" r="4" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M14 10L22 18L30 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M36 4 C41 0 44 2 42 7 C38 9 35 7 36 4Z" fill="#4CAF50"/>
            </svg>
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '26px', fontWeight: 900, letterSpacing: '5px', margin: 0 }}>U-BIKE</h1>
          <p style={{ color: '#42C8F5', fontSize: '11px', letterSpacing: '3px', margin: '4px 0 0', fontWeight: 500 }}>ADMIN PORTAL</p>
        </div>

        {/* Spinning border card */}
        <div style={borderStyle}>
          <div style={{
            background: '#0A1220',
            borderRadius: '18px',
            padding: '36px 32px',
          }}>

            {/* Form header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>🔐</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '14px', letterSpacing: '3px' }}>SIGN IN</span>
                <span style={{ fontSize: '18px' }}>💙</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Admin access only</p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(207,68,68,0.15)',
                border: '1px solid rgba(207,68,68,0.5)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#FF7096',
                fontSize: '13px',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                style={{
                  width: '100%', padding: '13px 20px', borderRadius: '30px',
                  background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#42C8F5'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
              />

              {/* Password */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{
                    width: '100%', padding: '13px 48px 13px 20px', borderRadius: '30px',
                    background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)',
                    color: '#FFFFFF', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#42C8F5'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                    fontSize: '14px', padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: '30px', border: 'none',
                  background: loading ? 'rgba(66,200,245,0.5)' : '#42C8F5',
                  color: '#0A1A2E', fontWeight: 700, fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  transition: 'box-shadow 0.2s',
                  boxShadow: '0 0 0px #42C8F5',
                  marginTop: '4px',
                }}
                onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.boxShadow = '0 0 20px #42C8F5, 0 0 40px rgba(66,200,245,0.4)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.boxShadow = '0 0 0px #42C8F5'; }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Footer links */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <button type="button" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                  Forgot Password?
                </button>
                <span style={{ color: '#FF7096', fontSize: '12px', fontWeight: 700 }}>Admin Only</span>
              </div>
            </form>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
          u-bike Admin Portal v1.0 · Secure Access
        </p>
      </div>
    </div>
  );
}
