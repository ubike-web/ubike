import { useState, useEffect } from "react";
import logo from "/icon-ubike.png";

const APK_URL = "/ubike.apk";
const APP_VERSION = "1.0.0";
const APK_SIZE = "54 MB";

function DownloadApp() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    // Trigger APK download
    const a = document.createElement("a");
    a.href = APK_URL;
    a.download = "ubike.apk";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => { setDownloading(false); setDone(true); }, 1500);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-gradient-to-b from-[#040F26] via-[#0A2D6E] to-[#0E86CA] px-5 py-10">
      {/* Logo */}
      <img src={logo} alt="U-bike" className="w-24 h-24 object-contain mb-2 rounded-2xl" />
      <h1 className="text-white text-3xl font-black tracking-widest mb-1">U-BIKE</h1>
      <p className="text-[#42C8F5] text-xs tracking-widest mb-10">RIDES & ERRANDS</p>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 flex flex-col gap-5">

        {/* App info row */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A2D6E] to-[#0E86CA] flex items-center justify-center shadow-lg shadow-blue-900/50">
            <svg viewBox="0 0 44 36" width="30" height="24">
              <path d="M6 28L12 6L32 6L38 28" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <circle cx="4" cy="30" r="4" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="40" cy="30" r="4" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M36 4C41 0 44 2 42 7C38 9 35 7 36 4Z" fill="#4CAF50"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">U-bike</p>
            <p className="text-white/60 text-sm">Rides &amp; Errands</p>
            <div className="flex gap-3 mt-1">
              <span className="text-white/40 text-xs">v{APP_VERSION}</span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/40 text-xs">{APK_SIZE}</span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/40 text-xs">Android</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Features */}
        <ul className="flex flex-col gap-2">
          {[
            { icon: "🏍️", text: "Book bike or car rides instantly" },
            { icon: "📦", text: "Send parcels & run errands" },
            { icon: "📍", text: "Live GPS ride tracking" },
            { icon: "💬", text: "In-app chat with your captain" },
          ].map(f => (
            <li key={f.text} className="flex items-center gap-3 text-white/80 text-sm">
              <span className="text-lg">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10" />

        {/* Download button */}
        {isAndroid ? (
          <button
            onClick={handleDownload}
            disabled={downloading || done}
            className="w-full py-4 rounded-2xl font-bold text-[#0A1A2E] text-base flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: done ? '#4CAF50' : 'linear-gradient(135deg, #42C8F5, #0E86CA)',
              boxShadow: '0 8px 24px rgba(66,200,245,0.35)',
            }}
          >
            {done ? (
              <><span className="text-lg">✅</span> Download started!</>
            ) : downloading ? (
              <><span className="animate-spin text-lg">⏳</span> Starting download...</>
            ) : (
              <><AndroidIcon /> Download APK</>
            )}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-white/60 text-sm mb-3">Open this page on your Android phone in Chrome to download</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-[#42C8F5] text-xs font-mono break-all">
              {window.location.origin}/download
            </div>
          </div>
        )}

        {/* Install instructions */}
        {isAndroid && (
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4">
            <p className="text-amber-300 text-xs font-bold mb-2">📋 How to install:</p>
            <ol className="text-white/60 text-xs flex flex-col gap-1 list-decimal list-inside">
              <li>Tap <strong className="text-white/80">Download APK</strong> above</li>
              <li>When prompted, tap <strong className="text-white/80">Open</strong> or go to your Downloads</li>
              <li>Tap the file and allow <strong className="text-white/80">Install unknown apps</strong> if asked</li>
              <li>Tap <strong className="text-white/80">Install</strong> and open U-bike</li>
            </ol>
          </div>
        )}
      </div>

      <p className="text-white/20 text-xs mt-8 text-center">U-bike · Safe, Fast &amp; Reliable</p>
    </div>
  );
}

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.16-.65-.06-.83.22l-1.88 3.24A10.53 10.53 0 0 0 12 8c-1.53 0-2.98.33-4.27.91L5.85 5.67c-.18-.28-.54-.38-.83-.22-.3.16-.42.54-.26.85L6.6 9.48A9.998 9.998 0 0 0 2 18h20a9.998 9.998 0 0 0-4.4-8.52zM7 15.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm10 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>
    </svg>
  );
}

export default DownloadApp;
