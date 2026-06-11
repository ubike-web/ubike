import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, CheckCircle, XCircle, LogOut } from "lucide-react";

function CaptainPendingApproval({ captain, onStatusChange }) {
  const [status, setStatus] = useState(captain?.approvalStatus || "pending");
  const [rejectionReason, setRejectionReason] = useState(captain?.rejectionReason || "");

  useEffect(() => {
    if (status !== "pending") return;

    const poll = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/profile`, {
          headers: { token },
        });
        const newStatus = res.data.captain?.approvalStatus;
        if (newStatus && newStatus !== "pending") {
          setStatus(newStatus);
          setRejectionReason(res.data.captain?.rejectionReason || "");
          if (newStatus === "approved") {
            // Give user a moment to see the success state, then reload
            setTimeout(() => window.location.reload(), 2500);
          }
        }
      } catch {}
    };

    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [status]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "/captain/login";
  };

  if (status === "approved") {
    return (
      <div className="w-full h-dvh flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold">You're Approved!</h2>
        <p className="text-gray-500">Your account has been verified. Redirecting you now…</p>
        <div className="mt-2 w-8 h-1 bg-green-400 rounded-full animate-pulse" />
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="w-full h-dvh flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Application Rejected</h2>
        <p className="text-gray-500 text-sm">
          We were unable to verify your documents.
        </p>
        {rejectionReason && (
          <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <p className="text-xs font-semibold text-red-600 mb-1">Reason from admin:</p>
            <p className="text-sm text-red-700">{rejectionReason}</p>
          </div>
        )}
        <p className="text-xs text-gray-400">
          Please sign up again with correct documents. Contact support if you believe this is a mistake.
        </p>
        <button
          onClick={logout}
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold"
        >
          <LogOut size={16} /> Back to Login
        </button>
      </div>
    );
  }

  // Pending state
  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center p-8 text-center gap-6">
      {/* Animated clock icon */}
      <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center">
        <Clock size={44} className="text-orange-400 animate-pulse" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Under Review</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
          Your application and documents are being reviewed by our team.
          This usually takes <strong>24–48 hours</strong>.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-300 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm bg-gray-50 rounded-2xl p-5 text-left space-y-3">
        <Step done label="Registration fee paid" />
        <Step done label="Documents submitted" />
        <Step done label="Face verification complete" />
        <Step label="Admin review in progress" active />
        <Step label="Account activation" />
      </div>

      <p className="text-xs text-gray-400">
        You will be redirected automatically once approved.
      </p>

      <button onClick={logout} className="text-xs text-gray-400 underline">
        Logout
      </button>
    </div>
  );
}

function Step({ label, done, active }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
        ${done ? "bg-green-500" : active ? "bg-orange-400 animate-pulse" : "bg-gray-200"}`}>
        {done && <CheckCircle size={12} className="text-white" />}
      </div>
      <span className={`text-sm ${done ? "text-gray-700" : active ? "text-orange-500 font-medium" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

export default CaptainPendingApproval;
