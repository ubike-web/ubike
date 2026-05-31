'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

type Phase = 'loader' | 'lamp' | 'login' | 'register';

export default function LoginPage() {
  const [phase, setPhase] = useState<Phase>('loader');

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', fontFamily: 'Poppins, sans-serif' }}>
      {phase === 'loader'   && <CatLoader onDone={() => setPhase('lamp')} />}
      {phase === 'lamp'     && <LampScreen onDone={() => setPhase('login')} />}
      {phase === 'login'    && <LoginForm onSwitch={() => setPhase('register')} />}
      {phase === 'register' && <RegisterForm onSwitch={() => setPhase('login')} />}
    </div>
  );
}

// ─── Phase 1: Cat Loader ──────────────────────────────────────────────────────
function CatLoader({ onDone }: { onDone: () => void }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    const d = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 400);
    return () => { clearTimeout(t); clearInterval(d); };
  }, [onDone]);

  const segments = Array.from({ length: 30 }, (_, i) => i);
  const total = 30;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D1B2A' }}>
      <style>{`
        @keyframes cat-seg {
          0%   { transform: rotate(0deg) translateX(72px); }
          100% { transform: rotate(-360deg) translateX(72px); }
        }
        .cat-seg::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #42C8F5 20%, #0E86CA 20% 80%, #42C8F5 80%);
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
      `}</style>

      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
        {segments.map(i => {
          const t = i / (total - 1);
          const angle = -20 + t * 40; // fan spread
          const delay = i * 0.02;
          const isHead = i === 0;
          const isTail = i === total - 1;
          const w = isHead ? 18 : isTail ? 10 : 14;
          const h = isHead ? 14 : isTail ? 8 : 10;
          const opacity = 0.4 + 0.6 * t;

          return (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: `${w}px`, height: `${h}px`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            }}>
              <div className="cat-seg" style={{
                width: '100%', height: '100%', position: 'relative',
                animation: `cat-seg 2s cubic-bezier(0.6,0,0.4,1) ${delay}s infinite`,
                opacity,
              }} />
            </div>
          );
        })}
      </div>

      <p style={{
        color: '#FFFFFF', fontSize: '22px', fontWeight: 300, letterSpacing: '4px',
        marginTop: '32px', animation: 'pulse-text 1s ease-in-out infinite',
      }}>
        Loading{dots}
      </p>
    </div>
  );
}

// ─── Phase 2: Lamp ────────────────────────────────────────────────────────────
function LampScreen({ onDone }: { onDone: () => void }) {
  const [isOn, setIsOn] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [cordY, setCordY] = useState(340);

  const handleTap = async () => {
    if (isOn) return;
    // Animate cord pull
    setCordY(380);
    setTimeout(() => setCordY(340), 300);
    setTimeout(() => {
      setIsOn(true);
      setTimeout(() => {
        setShowLogo(true);
        setTimeout(onDone, 3000);
      }, 400);
    }, 200);
  };

  return (
    <div
      onClick={handleTap}
      style={{
        height: '100vh', cursor: 'pointer',
        background: isOn
          ? 'radial-gradient(ellipse at 50% 20%, rgba(66,200,245,0.25) 0%, #0A1A2E 55%, #040F26 100%)'
          : '#0D1B2A',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', transition: 'background 0.8s ease',
        position: 'relative', overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes logo-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(66,200,245,0.6)); }
          50%       { filter: drop-shadow(0 0 28px rgba(66,200,245,1)); }
        }
        @keyframes tap-hint {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50%       { opacity: 0.8; transform: translateY(6px); }
        }
      `}</style>

      {/* Light cone */}
      {isOn && (
        <div style={{
          position: 'absolute', top: '200px', left: '50%',
          transform: 'translateX(-50%)',
          width: '600px', height: '500px',
          background: 'conic-gradient(from 250deg at 50% 0%, transparent 0deg, rgba(66,200,245,0.18) 30deg, transparent 60deg)',
          pointerEvents: 'none',
          animation: 'glow-pulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Lamp SVG */}
      <svg
        viewBox="0 0 333 484"
        style={{ width: '200px', marginTop: '40px', overflow: 'visible', transition: 'filter 0.6s ease',
          filter: isOn ? 'drop-shadow(0 0 20px rgba(66,200,245,0.8))' : 'none' }}
      >
        {/* Lamp shade */}
        <path
          d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"
          fill={isOn ? '#1A6FA8' : '#0A2D6E'}
          style={{ transition: 'fill 0.6s ease' }}
        />
        {/* Shade opening glow */}
        <ellipse cx="165" cy="220" rx="130" ry="20"
          fill={isOn ? 'rgba(66,200,245,0.8)' : '#0A1A3E'}
          style={{ transition: 'fill 0.6s ease' }}
        />
        {/* Post */}
        <path d="M180 142h-30v286c0 3.866 6.716 7 15 7 8.284 0 15-3.134 15-7V142z"
          fill={isOn ? '#1A7BB5' : '#0A2D6E'}
          style={{ transition: 'fill 0.6s ease' }}
        />
        {/* Base */}
        <path d="M165 464c44.183 0 80-8.954 80-20v-14H85v14c0 11.046 35.817 20 80 20z"
          fill={isOn ? '#1A7BB5' : '#0A2D6E'}
          style={{ transition: 'fill 0.6s ease' }}
        />
        <ellipse cx="165" cy="430" rx="80" ry="20"
          fill={isOn ? '#0E86CA' : '#0A3060'}
          style={{ transition: 'fill 0.6s ease' }}
        />
        {/* Cord */}
        <line x1="124" y1="220" x2="124" y2={cordY}
          stroke={isOn ? '#42C8F5' : '#1A3A5C'}
          strokeWidth="5" strokeLinecap="round"
          style={{ transition: 'stroke 0.5s ease' }}
        />
        {/* Pull handle */}
        <circle cx="124" cy={cordY}
          r="10" fill={isOn ? '#42C8F5' : '#1A6FA8'}
          style={{ transition: 'fill 0.5s ease, cy 0.3s ease' }}
        />
        {/* Face — eyes */}
        <path
          d={isOn
            ? "M102 130 L116 130 M214 130 L228 130"  // open eyes
            : "M109 130 Q116 122 123 130 M207 130 Q214 122 221 130"}  // sleepy arcs
          stroke={isOn ? '#0A1A2E' : '#1A3A5C'}
          strokeWidth="4" strokeLinecap="round" fill="none"
          style={{ transition: 'all 0.4s ease' }}
        />
        {/* Smile */}
        {isOn && (
          <>
            <path d="M140 165 Q165 182 190 165" stroke="#0A1A2E" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <ellipse cx="168" cy="176" rx="12" ry="9" fill="#FF7096" opacity="0.9"/>
          </>
        )}
        {/* Bulb glow */}
        {isOn && (
          <circle cx="165" cy="216" r="16" fill="rgba(255,240,160,0.95)"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,240,160,0.8))' }}
          />
        )}
      </svg>

      {/* Logo reveal */}
      {showLogo && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px',
          animation: 'logo-in 0.7s ease forwards',
        }}>
          {/* Motorcycle SVG logo */}
          <svg viewBox="0 0 160 100" width="90" height="56" style={{ filter: 'drop-shadow(0 0 12px rgba(66,200,245,0.7))' }}>
            <line x1="32" y1="52" x2="56" y2="38" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="128" y1="52" x2="104" y2="38" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <rect x="22" y="46" width="12" height="8" rx="3" fill="white"/>
            <rect x="126" y="46" width="12" height="8" rx="3" fill="white"/>
            <path d="M58 38 Q60 22 80 18 Q100 22 102 38 L97 48 Q80 52 63 48 Z" fill="white"/>
            <circle cx="80" cy="39" r="8" fill="#0E86CA"/>
            <circle cx="80" cy="39" r="5" fill="white"/>
            <rect x="71" y="48" width="4" height="22" rx="2" fill="white"/>
            <rect x="85" y="48" width="4" height="22" rx="2" fill="white"/>
            <rect x="67" y="70" width="26" height="34" rx="5" fill="white"/>
            <path d="M120 24 C130 14 136 18 134 24 C129 27 120 24 120 24Z" fill="#4CAF50"/>
            <line x1="140" y1="88" x2="156" y2="88" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <line x1="140" y1="96" x2="154" y2="96" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>

          <h1 style={{
            color: '#FFFFFF', fontSize: '32px', fontWeight: 900, letterSpacing: '6px',
            margin: '10px 0 4px',
            textShadow: '0 0 20px rgba(66,200,245,0.8), 0 0 40px rgba(66,200,245,0.4)',
          }}>U-BIKE</h1>
          <p style={{ color: '#42C8F5', fontSize: '11px', letterSpacing: '3px', margin: 0 }}>ADMIN PORTAL</p>
        </div>
      )}

      {/* Tap hint */}
      {!isOn && (
        <div style={{ position: 'absolute', bottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '2px', margin: 0, animation: 'tap-hint 1.5s ease-in-out infinite' }}>
            tap to turn on
          </p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)" style={{ animation: 'tap-hint 1.5s ease-in-out infinite' }}>
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Phase 3: Login Form ──────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [angle, setAngle] = useState(0);
  const login = useAuthStore(s => s.login);
  const router = useRouter();

  useEffect(() => {
    let frame: number;
    const tick = () => { setAngle(a => (a + 0.7) % 360); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #040F26 0%, #0A2D6E 45%, #0E86CA 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Logo />
        <SpinCard angle={angle}>
          <FormHeader icon="🔐" title="SIGN IN" sub="Admin access only" />
          {error && <ErrorBox msg={error} />}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <DarkInput type="email" value={email} onChange={setEmail} placeholder="Email address" />
            <PasswordInput value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass(!showPass)} />
            <GlowBtn loading={loading} label="Sign In" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <PlainBtn label="Forgot Password?" />
              <span
                onClick={onSwitch}
                style={{ color: '#42C8F5', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Create Account →
              </span>
            </div>
          </form>
        </SpinCard>
        <Footer />
      </div>
    </div>
  );
}

// ─── Phase 4: Register Form ───────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let frame: number;
    const tick = () => { setAngle(a => (a + 0.7) % 360); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code !== 'UBIKE-ADMIN') {
      setError('Invalid admin access code');
      return;
    }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password, role: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      // Save token
      if (data.data?.tokens?.accessToken) {
        localStorage.setItem('ubike_admin_token', data.data.tokens.accessToken);
      }
      onSwitch(); // go to login
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #040F26 0%, #0A2D6E 45%, #0E86CA 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Logo />
        <SpinCard angle={angle}>
          <FormHeader icon="👤" title="CREATE ACCOUNT" sub="Admin registration requires access code" />
          {error && <ErrorBox msg={error} />}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <DarkInput type="text" value={name} onChange={setName} placeholder="Full Name" />
            <DarkInput type="email" value={email} onChange={setEmail} placeholder="Email address" />
            <PasswordInput value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass(!showPass)} />
            <DarkInput type="text" value={code} onChange={setCode} placeholder="Admin access code" />
            <GlowBtn loading={loading} label="Create Admin Account" />
            <div style={{ textAlign: 'center', marginTop: '2px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Already have an account? </span>
              <span onClick={onSwitch} style={{ color: '#FF7096', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Sign In
              </span>
            </div>
          </form>
        </SpinCard>
        <Footer />
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
      <div style={{
        width: '68px', height: '68px', borderRadius: '20px', margin: '0 auto 12px',
        background: 'linear-gradient(135deg, #0A2D6E, #0E86CA)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(14,134,202,0.5)',
      }}>
        <svg viewBox="0 0 44 36" width="30" height="24">
          <path d="M6 28L12 6L32 6L38 28" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <circle cx="4" cy="30" r="4" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="40" cy="30" r="4" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M14 10L22 18L30 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M36 4C41 0 44 2 42 7C38 9 35 7 36 4Z" fill="#4CAF50"/>
        </svg>
      </div>
      <h1 style={{ color: '#FFF', fontSize: '24px', fontWeight: 900, letterSpacing: '5px', margin: 0 }}>U-BIKE</h1>
      <p style={{ color: '#42C8F5', fontSize: '10px', letterSpacing: '3px', margin: '3px 0 0' }}>ADMIN PORTAL</p>
    </div>
  );
}

function SpinCard({ angle, children }: { angle: number; children: React.ReactNode }) {
  return (
    <div style={{
      background: `conic-gradient(from ${angle}deg, #0E86CA, #42C8F5, #0A2D6E, #0E86CA, #42C8F5, #0A2D6E, #0E86CA)`,
      padding: '3px', borderRadius: '22px',
      boxShadow: '0 0 30px rgba(14,134,202,0.35), 0 0 60px rgba(66,200,245,0.12)',
    }}>
      <div style={{ background: '#0A1220', borderRadius: '20px', padding: '32px 28px' }}>
        {children}
      </div>
    </div>
  );
}

function FormHeader({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '5px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ color: '#FFF', fontWeight: 700, fontSize: '14px', letterSpacing: '3px' }}>{title}</span>
        <span style={{ fontSize: '18px' }}>💙</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{sub}</p>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      background: 'rgba(207,68,68,0.15)', border: '1px solid rgba(207,68,68,0.4)',
      borderRadius: '10px', padding: '9px 14px', marginBottom: '14px',
      color: '#FF7096', fontSize: '12px', textAlign: 'center',
    }}>{msg}</div>
  );
}

function DarkInput({ type, value, onChange, placeholder }: { type: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required
      style={{
        width: '100%', padding: '13px 20px', borderRadius: '30px', boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.3)', border: `2px solid ${focused ? '#42C8F5' : 'rgba(255,255,255,0.2)'}`,
        color: '#FFF', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif',
        transition: 'border-color 0.2s',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function PasswordInput({ value, onChange, show, onToggle }: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder="Password" required
        style={{
          width: '100%', padding: '13px 48px 13px 20px', borderRadius: '30px', boxSizing: 'border-box',
          background: 'rgba(0,0,0,0.3)', border: `2px solid ${focused ? '#42C8F5' : 'rgba(255,255,255,0.2)'}`,
          color: '#FFF', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif',
          transition: 'border-color 0.2s',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button type="button" onClick={onToggle}
        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '14px', padding: 0 }}>
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}

function GlowBtn({ loading, label }: { loading: boolean; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="submit" disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '14px', borderRadius: '30px', border: 'none', marginTop: '4px',
        background: loading ? 'rgba(66,200,245,0.5)' : '#42C8F5',
        color: '#0A1A2E', fontWeight: 700, fontSize: '15px',
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif',
        boxShadow: hovered && !loading ? '0 0 20px #42C8F5, 0 0 40px rgba(66,200,245,0.4)' : '0 4px 14px rgba(66,200,245,0.3)',
        transition: 'box-shadow 0.2s, background 0.2s',
      }}>
      {loading ? 'Please wait...' : label}
    </button>
  );
}

function PlainBtn({ label }: { label: string }) {
  return (
    <button type="button" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
      {label}
    </button>
  );
}

function Footer() {
  return (
    <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '11px', textAlign: 'center', marginTop: '18px' }}>
      u-bike Admin Portal v1.0 · Secure Access
    </p>
  );
}
