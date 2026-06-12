import { useContext, useEffect, useState } from "react";
import map from "/map.png";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import { Phone, Package, MapPin, Navigation, CheckCircle, ArrowLeftRight } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { Sidebar } from "../components";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";

const defaultErrandData = {
  _id: "",
  user: { fullname: { firstname: "No", lastname: "User" }, _id: "", phone: "" },
  pickup: "Pickup address",
  destination: "Delivery address",
  item_name: "Package",
  item_description: "",
  fare: 0,
  status: "pending",
};

function CaptainErrandsScreen() {
  const token = localStorage.getItem("token");
  const { captain } = useCaptain();
  const { socket } = useContext(SocketDataContext);
  const { alert, showAlert, hideAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const [riderLocation, setRiderLocation] = useState({ ltd: null, lng: null });
  const [mapLocation, setMapLocation] = useState(
    `https://www.google.com/maps?q=-1.286389,36.817223&output=embed`
  );

  const [earnings, setEarnings] = useState({ total: 0, today: 0 });
  const [stats, setStats] = useState({ delivered: 0, cancelled: 0, distanceTravelled: 0 });

  const [errand, setErrand] = useState(
    JSON.parse(localStorage.getItem("errandDetails")) || defaultErrandData
  );
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Panel states
  const [showDetailsPanel, setShowDetailsPanel] = useState(true);
  const [showErrandPanel, setShowErrandPanel] = useState(
    JSON.parse(localStorage.getItem("showErrandPanel")) || false
  );
  const [step, setStep] = useState(
    localStorage.getItem("errandStep") || "accept"
    // accept → going-pickup → verify-otp → delivering → done
  );

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: ltd, longitude: lng } = pos.coords;
          setRiderLocation({ ltd, lng });
          setMapLocation(`https://www.google.com/maps?q=${ltd},${lng}&output=embed`);
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: { ltd, lng },
          });
        },
        (err) => Console.log("Geolocation error:", err)
      );
    }
  };

  const clearErrandData = () => {
    setStep("accept");
    setLoading(false);
    setShowDetailsPanel(true);
    setShowErrandPanel(false);
    setErrand(defaultErrandData);
    setOtp("");
    setOtpError("");
    localStorage.removeItem("errandDetails");
    localStorage.removeItem("showErrandPanel");
    localStorage.removeItem("errandStep");
    if (riderLocation.ltd) {
      setMapLocation(`https://www.google.com/maps?q=${riderLocation.ltd},${riderLocation.lng}&output=embed`);
    }
  };

  const acceptErrand = async () => {
    if (!errand._id) return;
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/errand/confirm`,
        { errandId: errand._id },
        { headers: { token } }
      );
      setStep("going-pickup");
      setShowDetailsPanel(false);
      setMapLocation(
        `https://www.google.com/maps?q=${encodeURIComponent(errand.pickup)}&output=embed`
      );
    } catch (err) {
      showAlert("Error", err.response?.data?.message || "Could not accept errand", "failure");
      clearErrandData();
    } finally {
      setLoading(false);
    }
  };

  const verifyPickupOTP = async () => {
    if (!errand._id || otp.length !== 6) return;
    try {
      setLoading(true);
      setOtpError("");
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/errand/start?errandId=${errand._id}&otp=${otp}`,
        { headers: { token } }
      );
      setStep("delivering");
      setMapLocation(
        `https://www.google.com/maps?q=${encodeURIComponent(errand.destination)}&output=embed`
      );
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const completeErrand = async () => {
    if (!errand._id) return;
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/errand/complete`,
        { errandId: errand._id },
        { headers: { token } }
      );
      showAlert("Delivered!", "Errand completed successfully", "success");
      setTimeout(clearErrandData, 1500);
    } catch (err) {
      showAlert("Error", err.response?.data?.message || "Could not complete errand", "failure");
    } finally {
      setLoading(false);
    }
  };

  const switchService = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/captain/reset-mode`,
        {},
        { headers: { token } }
      );
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  // Socket join + events
  useEffect(() => {
    if (captain._id) {
      socket.emit("join", { userId: captain._id, userType: "captain" });
      updateLocation();
    }

    socket.on("new-errand", (data) => {
      Console.log("New errand:", data);
      setStep("accept");
      setErrand(data);
      setShowErrandPanel(true);
      setShowDetailsPanel(false);
    });

    socket.on("errand-cancelled", () => {
      showAlert("Cancelled", "The errand was cancelled", "failure");
      clearErrandData();
    });

    return () => {
      socket.off("new-errand");
      socket.off("errand-cancelled");
    };
  }, [captain]);

  // Persist errand state across refreshes
  useEffect(() => { localStorage.setItem("errandDetails", JSON.stringify(errand)); }, [errand]);
  useEffect(() => { localStorage.setItem("showErrandPanel", JSON.stringify(showErrandPanel)); }, [showErrandPanel]);
  useEffect(() => { localStorage.setItem("errandStep", step); }, [step]);

  // Calculate captain stats from rides (errands won't be in captain.rides yet, so just show zeros initially)
  useEffect(() => {
    let total = 0, today = 0, delivered = 0, cancelled = 0, dist = 0;
    const todayDate = new Date().toDateString();
    (captain.rides || []).forEach((r) => {
      if (r.status === "completed") { delivered++; dist += r.distance || 0; }
      if (r.status === "cancelled") cancelled++;
      total += r.fare || 0;
      if (new Date(r.updatedAt).toDateString() === todayDate && r.status === "completed") today += r.fare || 0;
    });
    setEarnings({ total, today });
    setStats({ delivered, cancelled, distanceTravelled: Math.round(dist / 1000) });
  }, [captain]);

  return (
    <div
      className="relative w-full h-dvh bg-contain"
      style={{ backgroundImage: `url(${map})` }}
    >
      <Alert heading={alert.heading} text={alert.text} isVisible={alert.isVisible} onClose={hideAlert} type={alert.type} />
      <Sidebar />

      <iframe
        src={mapLocation}
        className="map w-full h-[80vh]"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Captain details panel (idle state) */}
      {showDetailsPanel && (
        <div className="absolute bottom-0 flex flex-col justify-start p-4 gap-2 rounded-t-xl bg-white h-fit w-full shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-full w-10 h-10 bg-orange-400 flex items-center justify-center select-none">
                <span className="text-lg text-white font-semibold">
                  {captain?.fullname?.firstname?.[0]}{captain?.fullname?.lastname?.[0]}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-5">
                  {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                </h1>
                <p className="text-xs flex items-center gap-1 text-gray-500">
                  <Phone size={11} /> {captain?.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Today</p>
              <h1 className="font-bold text-base">KES {earnings.today}</h1>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex justify-around items-center mt-1 py-3 rounded-xl bg-zinc-800">
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-0.5 text-xl font-semibold">{stats.delivered}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">Deliveries<br />Done</p>
            </div>
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-0.5 text-xl font-semibold">{stats.distanceTravelled}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">Km<br />Travelled</p>
            </div>
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-0.5 text-xl font-semibold">{stats.cancelled}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">Cancelled</p>
            </div>
          </div>

          {/* Vehicle + switch service */}
          <div className="flex justify-between border-2 items-center pl-3 py-2 rounded-xl">
            <div>
              <h1 className="text-base font-semibold tracking-tight">{captain?.vehicle?.number}</h1>
              <p className="text-xs text-gray-500">{captain?.vehicle?.color} · Errands mode</p>
            </div>
            <div className="flex items-center gap-2 pr-2">
              <img className="h-12" src="/bike.webp" alt="bike" />
            </div>
          </div>

          <button
            onClick={switchService}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftRight size={14} /> Switch service
          </button>
        </div>
      )}

      {/* Errand request / active errand panel */}
      {showErrandPanel && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">

          {/* Step: Accept incoming errand */}
          {step === "accept" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Package size={20} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-4">New Errand Request</h2>
                  <p className="text-xs text-gray-500">{errand.user?.fullname?.firstname} {errand.user?.fullname?.lastname}</p>
                </div>
                <span className="ml-auto font-bold text-lg">KES {errand.fare}</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="flex gap-2 items-start">
                  <Package size={15} className="mt-0.5 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Item</p>
                    <p className="text-sm font-semibold">{errand.item_name || "Package"}</p>
                    {errand.item_description && (
                      <p className="text-xs text-gray-500 mt-0.5">{errand.item_description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <MapPin size={15} className="mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Pickup</p>
                    <p className="text-sm font-medium leading-4">{errand.pickup}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <Navigation size={15} className="mt-0.5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Deliver to</p>
                    <p className="text-sm font-medium leading-4">{errand.destination}</p>
                  </div>
                </div>
              </div>

              {errand.user?.phone && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Phone size={11} /> {errand.user.phone}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => clearErrandData()}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm"
                >
                  Decline
                </button>
                <button
                  onClick={acceptErrand}
                  disabled={loading}
                  className="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-bold text-sm disabled:opacity-60"
                >
                  {loading ? "Accepting…" : "Accept Errand"}
                </button>
              </div>
            </>
          )}

          {/* Step: Going to pickup */}
          {step === "going-pickup" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Navigation size={20} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-4">Going to Pickup</h2>
                  <p className="text-xs text-gray-500">Head to pickup location</p>
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-600 font-semibold mb-1">PICKUP ADDRESS</p>
                <p className="text-sm font-medium">{errand.pickup}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                <Package size={15} className="mt-0.5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Item to collect</p>
                  <p className="text-sm font-semibold">{errand.item_name || "Package"}</p>
                  {errand.item_description && (
                    <p className="text-xs text-gray-500">{errand.item_description}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-center text-gray-400">
                Ask for the OTP once you arrive at the pickup location
              </p>

              <button
                onClick={() => setStep("verify-otp")}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm"
              >
                I've Arrived — Enter OTP
              </button>
            </>
          )}

          {/* Step: Verify pickup OTP */}
          {step === "verify-otp" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} className="text-purple-500" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-4">Confirm Pickup</h2>
                  <p className="text-xs text-gray-500">Enter the OTP from the sender</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.slice(0, 6)); setOtpError(""); }}
                  className="w-full text-center text-2xl font-bold tracking-widest border-2 border-gray-200 rounded-xl py-3 focus:outline-none focus:border-purple-400"
                />
                {otpError && <p className="text-xs text-red-500 text-center">{otpError}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("going-pickup")}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm"
                >
                  Back
                </button>
                <button
                  onClick={verifyPickupOTP}
                  disabled={loading || otp.length !== 6}
                  className="flex-[2] py-3 rounded-xl bg-purple-600 text-white font-bold text-sm disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Confirm & Pick Up"}
                </button>
              </div>
            </>
          )}

          {/* Step: Delivering */}
          {step === "delivering" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Navigation size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-4">Item Picked Up</h2>
                  <p className="text-xs text-gray-500">Head to delivery destination</p>
                </div>
                <span className="ml-auto font-bold text-base text-green-700">KES {errand.fare}</span>
              </div>

              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-700 font-semibold mb-1">DELIVER TO</p>
                <p className="text-sm font-medium">{errand.destination}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <Package size={15} className="text-gray-500 flex-shrink-0" />
                <p className="text-sm font-medium">{errand.item_name || "Package"}</p>
              </div>

              <button
                onClick={completeErrand}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-sm disabled:opacity-60"
              >
                {loading ? "Completing…" : "Mark as Delivered"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CaptainErrandsScreen;
