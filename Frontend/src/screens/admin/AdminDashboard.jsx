import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Users, CheckCircle, XCircle, Clock, LogOut, ChevronRight, RefreshCw } from "lucide-react";

const API = () => import.meta.env.VITE_SERVER_URL;
const adminHeaders = () => ({ admintoken: localStorage.getItem("adminToken") });

function AdminDashboard() {
  const navigate = useNavigate();
  const [captains, setCaptains] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login");
      return;
    }
    load();
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const [captainsRes, statsRes] = await Promise.all([
        axios.get(`${API()}/admin/captains?status=${filter}`, { headers: adminHeaders() }),
        axios.get(`${API()}/admin/stats`, { headers: adminHeaders() }),
      ]);
      setCaptains(captainsRes.data.captains || []);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => { setRefreshing(true); load(); };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const statusColor = {
    pending: "bg-orange-100 text-orange-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <span className="text-white text-xs font-bold">UB</span>
          </div>
          <h1 className="text-lg font-bold">U-bike Admin</h1>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Pending Review" value={stats.pending} icon={<Clock size={20} className="text-orange-500" />} color="bg-orange-50 border-orange-200" />
          <StatCard label="Approved" value={stats.approved} icon={<CheckCircle size={20} className="text-green-500" />} color="bg-green-50 border-green-200" />
          <StatCard label="Rejected" value={stats.rejected} icon={<XCircle size={20} className="text-red-500" />} color="bg-red-50 border-red-200" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Captain Applications</h2>
            <div className="flex items-center gap-3">
              {/* Filter tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                {["pending", "approved", "rejected"].map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition capitalize
                      ${filter === s ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <button onClick={refresh} disabled={refreshing}
                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
          ) : captains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <Users size={32} />
              <p className="text-sm">No {filter} applications</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Captain</th>
                  <th className="text-left px-6 py-3">Phone</th>
                  <th className="text-left px-6 py-3">Vehicle</th>
                  <th className="text-left px-6 py-3">Payment</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {captains.map((c) => (
                  <tr key={c.id}
                    onClick={() => navigate(`/admin/captain/${c.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm">{c.firstname} {c.lastname}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm capitalize">{c.vehicle_type} • {c.vehicle_make} {c.vehicle_model}</p>
                      <p className="text-xs text-gray-400">{c.vehicle_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                        ${c.registration_payment_paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {c.registration_payment_paid ? "✓ Paid" : "✗ Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColor[c.approval_status]}`}>
                        {c.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight size={16} className="text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default AdminDashboard;
