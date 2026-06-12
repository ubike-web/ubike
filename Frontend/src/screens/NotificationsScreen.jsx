import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CheckCircle, Navigation, Package, CreditCard, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "ubike_notifications";

export function addNotification(notification) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const updated = [{ ...notification, id: Date.now(), timestamp: new Date().toISOString(), read: false }, ...stored].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  // Dispatch event so badge updates in real time
  window.dispatchEvent(new Event("ubike-notification"));
}

export function getUnreadCount() {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  return stored.filter((n) => !n.read).length;
}

function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  const load = () => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setNotifications(stored);
    // Mark all read
    const allRead = stored.map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRead));
  };

  useEffect(() => { load(); }, []);

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setNotifications([]);
  };

  const fmtTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
  };

  const iconFor = (type) => {
    if (type === "ride") return <Navigation size={16} className="text-blue-500" />;
    if (type === "errand") return <Package size={16} className="text-orange-500" />;
    if (type === "payment") return <CreditCard size={16} className="text-green-600" />;
    return <Bell size={16} className="text-gray-500" />;
  };

  const bgFor = (type) => ({
    ride: "bg-blue-50",
    errand: "bg-orange-50",
    payment: "bg-green-50",
  }[type] || "bg-gray-50");

  return (
    <div className="flex flex-col h-dvh bg-white">
      <div className="p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-3">
          <ArrowLeft strokeWidth={3} className="cursor-pointer" onClick={() => navigate(-1)} />
          <h1 className="text-2xl font-semibold">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button onClick={clear} className="text-xs text-red-500 flex items-center gap-1">
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">Ride updates and payment alerts will appear here</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-4 ${!n.read ? "bg-zinc-50" : ""}`}>
                <div className={`w-9 h-9 rounded-full ${bgFor(n.type)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {iconFor(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-5">{n.title}</p>
                  {n.body && <p className="text-xs text-zinc-500 mt-0.5 leading-4">{n.body}</p>}
                  <p className="text-xs text-zinc-400 mt-1">{fmtTime(n.timestamp)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsScreen;
