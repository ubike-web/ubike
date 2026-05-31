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
  const [glowSize, setGlowSize] = useState(0);

  useEffect(() => {
    if (!isOn) return;
    // Animate glow expanding after light turns on
    let size = 0;
    const id = setInterval(() => {
      size = Math.min(size + 4, 100);
      setGlowSize(size);
      if (size >= 100) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [isOn]);

  const handleTap = () => {
    if (isOn) return;
    setCordY(390);
    setTimeout(() => setCordY(340), 320);
    setTimeout(() => {
      setIsOn(true);
      setTimeout(() => {
        setShowLogo(true);
        setTimeout(onDone, 3000);
      }, 600);
    }, 250);
  };

  const o = glowSize / 100; // opacity/scale factor 0→1

  return (
    <div
      onClick={handleTap}
      style={{
        height: '100vh',
        cursor: isOn ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        // Realistic dark room — deep navy, not pure black
        background: isOn
          ? `radial-gradient(ellipse 70% 60% at 50% 38%,
              rgba(14,134,202,${0.18 * o}) 0%,
              rgba(10,45,110,${0.25 * o}) 30%,
              #060D18 65%,
              #030810 100%)`
          : 'radial-gradient(ellipse at 50% 30%, #0A1828 0%, #060D18 60%, #030810 100%)',
        transition: 'background 1s ease',
      }}
    >
      <style>{`
        @keyframes logo-in {
          from { opacity: 0; transform: translateY(24px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bulb-flicker {
          0%,100% { opacity: 1; }
          92%      { opacity: 1; }
          93%      { opacity: 0.7; }
          94%      { opacity: 1; }
          96%      { opacity: 0.85; }
          97%      { opacity: 1; }
        }
        @keyframes tap-hint {
          0%,100% { opacity: 0.25; transform: translateY(0); }
          50%      { opacity: 0.7;  transform: translateY(7px); }
        }
        @keyframes ambient-pulse {
          0%,100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
      `}</style>

      {/* ── Realistic light layers when ON ─────────────────────────────── */}
      {isOn && (
        <>
          {/* Wide ambient fill — soft room glow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 90% 80% at 50% 42%,
              rgba(66,200,245,${0.06 * o}) 0%,
              rgba(14,134,202,${0.04 * o}) 40%,
              transparent 75%)`,
            animation: 'ambient-pulse 3s ease-in-out infinite',
          }} />

          {/* Hard cone — trapezoid light beam */}
          <div style={{
            position: 'absolute', top: '230px', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: `${220 * o}px solid transparent`,
            borderRight: `${220 * o}px solid transparent`,
            borderTop: `${480 * o}px solid rgba(66,200,245,${0.055 * o})`,
            pointerEvents: 'none',
            filter: 'blur(2px)',
          }} />

          {/* Inner bright core of cone */}
          <div style={{
            position: 'absolute', top: '232px', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: `${90 * o}px solid transparent`,
            borderRight: `${90 * o}px solid transparent`,
            borderTop: `${360 * o}px solid rgba(180,230,255,${0.07 * o})`,
            pointerEvents: 'none',
            filter: 'blur(1px)',
          }} />

          {/* Floor pool of light */}
          <div style={{
            position: 'absolute', bottom: '10%', left: '50%',
            transform: 'translateX(-50%)',
            width: `${500 * o}px`, height: `${80 * o}px`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(66,200,245,${0.12 * o}) 0%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(8px)',
          }} />
        </>
      )}

      {/* ── Lamp SVG ────────────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 333 484"
        style={{
          width: '220px', marginTop: '28px', overflow: 'visible',
          filter: isOn
            ? `drop-shadow(0 0 ${12 + 20 * o}px rgba(14,134,202,${0.5 + 0.4 * o}))
               drop-shadow(0 4px 12px rgba(0,0,0,0.7))`
            : 'drop-shadow(0 4px 16px rgba(0,0,0,0.8))',
          transition: 'filter 0.8s ease',
        }}
      >
        <defs>
          {/* Metallic shade gradient — lit left side */}
          <linearGradient id="shade-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={isOn ? '#1A7BB5' : '#0A2540'} />
            <stop offset="30%"  stopColor={isOn ? '#0E86CA' : '#0D3560'} />
            <stop offset="60%"  stopColor={isOn ? '#0A6BA0' : '#0A2D6E'} />
            <stop offset="100%" stopColor={isOn ? '#073E5E' : '#061A3A'} />
          </linearGradient>
          {/* Post gradient */}
          <linearGradient id="post-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={isOn ? '#1890D8' : '#0D3560'} />
            <stop offset="50%"  stopColor={isOn ? '#0E86CA' : '#0A2D6E'} />
            <stop offset="100%" stopColor={isOn ? '#073E5E' : '#061A3A'} />
          </linearGradient>
          {/* Base gradient */}
          <linearGradient id="base-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={isOn ? '#1485C8' : '#0B2E62'} />
            <stop offset="50%"  stopColor={isOn ? '#0E86CA' : '#0A2D6E'} />
            <stop offset="100%" stopColor={isOn ? '#073060' : '#061230'} />
          </linearGradient>
          {/* Opening glow */}
          <radialGradient id="opening-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={isOn ? 'rgba(66,200,245,0.95)' : 'rgba(10,30,80,0.9)'} />
            <stop offset="60%"  stopColor={isOn ? 'rgba(14,134,202,0.7)'  : 'rgba(8,20,55,0.8)'} />
            <stop offset="100%" stopColor={isOn ? 'rgba(10,60,120,0.3)'   : 'rgba(5,12,35,0.6)'} />
          </radialGradient>
          {/* Shade highlight (sheen) */}
          <linearGradient id="shade-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.12)" />
            <stop offset="25%"  stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* Bulb bloom */}
          <radialGradient id="bulb-bloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(220,240,255,1)" />
            <stop offset="40%"  stopColor="rgba(66,200,245,0.9)" />
            <stop offset="100%" stopColor="rgba(14,134,202,0)" />
          </radialGradient>
        </defs>

        {/* Shade body */}
        <path
          d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"
          fill="url(#shade-grad)"
          style={{ transition: 'fill 0.7s ease' }}
        />
        {/* Shade sheen highlight */}
        <path
          d="M164.859 0c55.229 0 100 8.954 100 20l29.859 199.06C291.529 208.451 234.609 200 164.859 200S38.189 208.451 35 219.06L64.859 20c0-11.046 44.772-20 100-20z"
          fill="url(#shade-sheen)"
        />

        {/* Shade rim (top ellipse) */}
        <ellipse cx="165" cy="20" rx="100" ry="14"
          fill={isOn ? '#1A9EDF' : '#0B3570'}
          style={{ transition: 'fill 0.7s ease' }}
        />

        {/* Opening — glowing ellipse */}
        <ellipse cx="165" cy="220" rx="130" ry="20"
          fill="url(#opening-glow)"
          style={{ transition: 'fill 0.7s ease' }}
        />

        {/* Post */}
        <path d="M180 142h-30v286c0 3.866 6.716 7 15 7 8.284 0 15-3.134 15-7V142z"
          fill="url(#post-grad)"
          style={{ transition: 'fill 0.7s ease' }}
        />
        {/* Post highlight */}
        <rect x="150" y="142" width="8" height="286" rx="4"
          fill="rgba(255,255,255,0.08)"
        />

        {/* Base side */}
        <path d="M165 464c44.183 0 80-8.954 80-20v-14H85v14c0 11.046 35.817 20 80 20z"
          fill="url(#base-grad)"
          style={{ transition: 'fill 0.7s ease' }}
        />
        {/* Base top */}
        <ellipse cx="165" cy="430" rx="80" ry="20"
          fill={isOn ? '#1A9EDF' : '#0B3570'}
          style={{ transition: 'fill 0.7s ease' }}
        />
        {/* Base highlight sheen */}
        <ellipse cx="145" cy="428" rx="30" ry="7"
          fill="rgba(255,255,255,0.07)"
        />

        {/* Cord */}
        <line x1="124" y1="225" x2="124" y2={cordY}
          stroke={isOn ? '#42C8F5' : '#0D3060'}
          strokeWidth="4.5" strokeLinecap="round"
          style={{ transition: 'stroke 0.6s ease, stroke-dashoffset 0.3s ease' }}
        />
        {/* Cord highlight */}
        <line x1="125" y1="225" x2="125" y2={cordY}
          stroke={isOn ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'}
          strokeWidth="1.5" strokeLinecap="round"
          style={{ transition: 'stroke 0.6s ease' }}
        />
        {/* Pull handle */}
        <circle cx="124" cy={cordY} r="11"
          fill={isOn ? '#0E86CA' : '#0A2D6E'}
          style={{ transition: 'fill 0.5s ease' }}
        />
        <circle cx="121" cy={cordY - 3} r="5"
          fill={isOn ? 'rgba(66,200,245,0.5)' : 'rgba(255,255,255,0.05)'}
          style={{ transition: 'fill 0.5s ease' }}
        />

        {/* Face — eyes */}
        <path
          d={isOn
            ? 'M100 128 L118 128 M212 128 L230 128'
            : 'M107 128 Q116 119 125 128 M205 128 Q214 119 223 128'}
          stroke={isOn ? 'rgba(10,26,62,0.9)' : 'rgba(66,200,245,0.4)'}
          strokeWidth="4.5" strokeLinecap="round" fill="none"
          style={{ transition: 'all 0.5s ease' }}
        />
        {/* Pupils when on */}
        {isOn && (
          <>
            <circle cx="109" cy="128" r="3" fill="rgba(10,26,62,0.8)" />
            <circle cx="221" cy="128" r="3" fill="rgba(10,26,62,0.8)" />
          </>
        )}
        {/* Smile */}
        {isOn && (
          <>
            <path d="M138 162 Q165 180 192 162" stroke="rgba(10,26,62,0.8)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <ellipse cx="168" cy="174" rx="11" ry="8" fill="rgba(224,105,82,0.9)" />
          </>
        )}

        {/* Bulb — bloom effect */}
        {isOn && (
          <>
            {/* Outer bloom */}
            <ellipse cx="165" cy="214" rx="36" ry="24"
              fill="url(#bulb-bloom)"
              opacity={o * 0.6}
              style={{ animation: 'bulb-flicker 6s ease-in-out infinite' }}
            />
            {/* Inner bright spot */}
            <ellipse cx="165" cy="214" rx="18" ry="12"
              fill="rgba(220,240,255,0.95)"
              style={{ animation: 'bulb-flicker 6s ease-in-out infinite', filter: 'blur(1px)' }}
            />
            {/* Core white */}
            <ellipse cx="165" cy="213" rx="9" ry="6" fill="white" />
          </>
        )}
        {/* Bulb socket (always visible) */}
        <ellipse cx="165" cy="216" rx="12" ry="8"
          fill={isOn ? 'rgba(14,134,202,0.3)' : 'rgba(10,45,110,0.6)'}
          style={{ transition: 'fill 0.5s ease' }}
        />
      </svg>

      {/* ── Logo reveal ──────────────────────────────────────────────────── */}
      {showLogo && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px',
          animation: 'logo-in 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <svg viewBox="0 0 160 100" width="92" height="58"
            style={{ filter: `drop-shadow(0 0 18px rgba(66,200,245,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.4))` }}>
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
            textShadow: '0 0 24px rgba(66,200,245,1), 0 0 48px rgba(14,134,202,0.7), 0 0 80px rgba(14,134,202,0.3)',
          }}>U-BIKE</h1>
          <p style={{ color: '#42C8F5', fontSize: '11px', letterSpacing: '4px', margin: 0, textShadow: '0 0 12px rgba(66,200,245,0.8)' }}>ADMIN PORTAL</p>
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ubike-api.onrender.com/api/v1';
    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password, role: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Registration failed');
      if (data.data?.tokens?.accessToken) {
        localStorage.setItem('ubike_admin_token', data.data.tokens.accessToken);
      }
      alert('Account created! Please sign in.');
      onSwitch();
    } catch (err: any) {
      setError(err.message === 'Failed to fetch'
        ? 'Cannot reach API. Check your internet or the API may be sleeping (Render free tier takes ~30s to wake).'
        : err.message);
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
