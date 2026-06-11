import { useState } from "react";
import axios from "axios";
import { Users, Package, ArrowRight, CheckCircle } from "lucide-react";

function CaptainModeSelect({ captain }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const vehicleType = captain?.vehicle?.type; // 'car' | 'bike' | 'auto'
  const isBike = vehicleType === "bike";

  const selectMode = async (mode) => {
    setLoading(mode);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/captain/set-mode`,
        { mode },
        { headers: { token } }
      );
      // Update cached userData so wrapper reads new mode on reload
      const stored = JSON.parse(localStorage.getItem("userData") || "{}");
      if (stored.data) stored.data.activeMode = mode;
      localStorage.setItem("userData", JSON.stringify(stored));
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="w-full min-h-dvh flex flex-col p-6 pt-10 bg-white">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <span className="text-sm text-green-600 font-medium">Account Approved</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">
          Welcome, {captain?.fullname?.firstname}!
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Choose how you want to operate on U-bike.
          {isBike && " You can switch anytime from your profile."}
        </p>
      </div>

      {/* Mode cards */}
      <div className="space-y-4 flex-1">

        {/* Passenger Rides — all vehicle types */}
        <ModeCard
          icon={<Users size={28} />}
          title="Passenger Rides"
          description="Accept ride requests from customers travelling to destinations"
          tags={["Car", "Bike", "Auto"]}
          dark
          loading={loading === "rides"}
          disabled={!!loading}
          onClick={() => selectMode("rides")}
        />

        {/* Errands — bikes only */}
        {isBike ? (
          <ModeCard
            icon={<Package size={28} />}
            title="Errands & Delivery"
            description="Pick up and deliver items, run errands for customers around the city"
            tags={["Bike only"]}
            dark={false}
            loading={loading === "errands"}
            disabled={!!loading}
            onClick={() => selectMode("errands")}
          />
        ) : (
          <div className="w-full flex items-center gap-4 p-5 border-2 border-dashed border-gray-200 rounded-2xl opacity-50 cursor-not-allowed">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-gray-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-400">Errands & Delivery</p>
              <p className="text-xs text-gray-400 mt-0.5">Available for bike captains only</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}

      {/* Vehicle info footer */}
      <div className="mt-8 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400 capitalize">
          Your vehicle: {captain?.vehicle?.make} {captain?.vehicle?.model} · {vehicleType}
        </p>
      </div>
    </div>
  );
}

function ModeCard({ icon, title, description, tags, dark, loading, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl transition active:scale-[0.98] disabled:opacity-60
        ${dark
          ? "bg-black text-white hover:bg-zinc-800"
          : "border-2 border-black text-black hover:bg-gray-50"
        }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
        ${dark ? "bg-white/10" : "bg-black/5"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg">{title}</p>
        <p className={`text-xs mt-0.5 leading-relaxed ${dark ? "opacity-70" : "text-gray-500"}`}>
          {description}
        </p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {tags.map((t) => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded-full
              ${dark ? "bg-white/20" : "bg-black/10"}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-1 flex-shrink-0">
        {loading ? (
          <div className={`w-5 h-5 border-2 rounded-full animate-spin
            ${dark ? "border-white/30 border-t-white" : "border-black/20 border-t-black"}`} />
        ) : (
          <ArrowRight size={20} className={dark ? "opacity-50" : "text-gray-400"} />
        )}
      </div>
    </button>
  );
}

export default CaptainModeSelect;
