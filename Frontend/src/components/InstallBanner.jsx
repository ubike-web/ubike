import { useState } from "react";
import logo from "/icon-ubike.png";

function InstallBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("install-dismissed") === "1"
  );

  if (dismissed) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 w-full flex-shrink-0"
      style={{ background: "#0A1628", borderBottom: "1px solid rgba(66,200,245,0.2)" }}
    >
      <img src={logo} alt="U-bike" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
      <p className="text-white text-xs flex-1 font-medium">Get the U-bike app</p>
      <a
        href="/ubike.apk"
        download="ubike.apk"
        className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 no-underline"
        style={{ background: "#42C8F5", color: "#0A1A2E" }}
      >
        Install
      </a>
      <button
        onClick={() => { sessionStorage.setItem("install-dismissed", "1"); setDismissed(true); }}
        className="text-white/40 text-sm leading-none flex-shrink-0 px-1"
      >
        ✕
      </button>
    </div>
  );
}

export default InstallBanner;
