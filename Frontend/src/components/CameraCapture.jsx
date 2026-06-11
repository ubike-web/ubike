import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

/**
 * Live camera selfie capture.
 * Props:
 *   onCapture(dataUrl) — called when a photo is confirmed
 *   onError(msg)       — called if camera access is denied
 */
function CameraCapture({ onCapture, onError }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();

  const [phase, setPhase] = useState("loading"); // loading | ready | countdown | captured | verifying | done | error
  const [captured, setCaptured] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [faceOk, setFaceOk] = useState(null); // null | true | false

  // Start camera on mount
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPhase("ready");
      })
      .catch((err) => {
        if (!active) return;
        setPhase("error");
        onError?.(err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permission and try again."
          : "Camera not available on this device.");
      });
    return () => {
      active = false;
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Countdown then snap
  const startCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    let count = 3;
    const id = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(id);
        snap();
      }
    }, 1000);
  };

  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    // Mirror the image (front camera) so text on ID looks correct
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
    stopCamera();
    setPhase("captured");
  };

  const retake = () => {
    setCaptured(null);
    setFaceOk(null);
    setVerifyMsg("");
    setPhase("loading");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPhase("ready");
      })
      .catch(() => setPhase("error"));
  };

  const confirmSelfie = async () => {
    setPhase("verifying");
    setVerifyMsg("Verifying face…");

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/captain/verify-face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: captured }),
      });
      const data = await res.json();

      if (data.faceDetected) {
        setFaceOk(true);
        setVerifyMsg("Face verified ✓");
        setPhase("done");
        onCapture(captured);
      } else {
        setFaceOk(false);
        setVerifyMsg("No face detected. Please retake — make sure your face is clearly visible.");
        setPhase("captured");
      }
    } catch {
      // If verification endpoint fails, accept anyway (fallback to manual review)
      setFaceOk(true);
      setVerifyMsg("Selfie saved for manual review.");
      setPhase("done");
      onCapture(captured);
    }
  };

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />

      {/* Live camera feed */}
      {(phase === "loading" || phase === "ready" || phase === "countdown") && (
        <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]" /* mirror */
          />

          {/* Face outline guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-52 border-4 border-white/60 rounded-full" />
          </div>

          {phase === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-white text-sm">Starting camera…</span>
            </div>
          )}

          {phase === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-white text-7xl font-bold drop-shadow-lg">{countdown}</span>
            </div>
          )}
        </div>
      )}

      {/* Captured preview */}
      {(phase === "captured" || phase === "verifying" || phase === "done") && captured && (
        <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
          <img src={captured} alt="Selfie" className="w-full h-full object-cover" />
          {phase === "verifying" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white text-sm animate-pulse">{verifyMsg}</span>
            </div>
          )}
          {phase === "done" && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 bg-green-500 text-white text-sm px-4 py-2 rounded-full">
                <CheckCircle size={16} /> {verifyMsg}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "error" && (
        <div className="w-full aspect-[4/3] bg-zinc-100 rounded-xl flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-red-400" />
          <span className="text-sm text-zinc-500 text-center px-4">
            Camera unavailable. Please allow camera access in your browser settings.
          </span>
        </div>
      )}

      {/* Feedback message */}
      {verifyMsg && phase !== "verifying" && phase !== "done" && (
        <p className={`text-xs mt-2 text-center ${faceOk === false ? "text-red-500" : "text-green-600"}`}>
          {verifyMsg}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-3">
        {phase === "ready" && (
          <button
            type="button"
            onClick={startCountdown}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg font-semibold"
          >
            <Camera size={18} /> Take Selfie
          </button>
        )}

        {phase === "captured" && (
          <>
            <button
              type="button"
              onClick={retake}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-zinc-300 rounded-lg font-semibold text-zinc-700"
            >
              <RefreshCw size={16} /> Retake
            </button>
            <button
              type="button"
              onClick={confirmSelfie}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg font-semibold"
            >
              <CheckCircle size={16} /> Use this photo
            </button>
          </>
        )}

        {phase === "done" && (
          <button
            type="button"
            onClick={retake}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-zinc-300 rounded-lg text-sm text-zinc-600"
          >
            <RefreshCw size={14} /> Retake selfie
          </button>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
