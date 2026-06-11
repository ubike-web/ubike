import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, CheckCircle, XCircle, User, Car, FileText, Camera, Phone, Mail, AlertCircle } from "lucide-react";

const API = () => import.meta.env.VITE_SERVER_URL;
const adminHeaders = () => ({ admintoken: localStorage.getItem("adminToken") });

function CaptainDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionDone, setActionDone] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) { navigate("/admin/login"); return; }
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API()}/admin/captain/${id}`, { headers: adminHeaders() });
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem("adminToken"); navigate("/admin/login"); }
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    setActionLoading("approve");
    try {
      await axios.post(`${API()}/admin/captain/${id}/approve`, {}, { headers: adminHeaders() });
      setActionDone("approved");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { alert("Please provide a rejection reason"); return; }
    setActionLoading("reject");
    try {
      await axios.post(`${API()}/admin/captain/${id}/reject`, { reason: rejectReason }, { headers: adminHeaders() });
      setActionDone("rejected");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-gray-500">Captain not found</p>
        <button onClick={() => navigate("/admin/dashboard")} className="text-sm underline">Back</button>
      </div>
    );
  }

  const { captain, kyc } = data;
  const isPending = captain.approval_status === "pending";

  if (actionDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center p-8">
        {actionDone === "approved"
          ? <CheckCircle size={48} className="text-green-500" />
          : <XCircle size={48} className="text-red-500" />}
        <h2 className="text-xl font-bold capitalize">{captain.firstname} has been {actionDone}</h2>
        <p className="text-sm text-gray-500">
          {actionDone === "approved"
            ? "Their account is now active. They can log in and start taking rides."
            : "They have been notified and can re-apply with correct documents."}
        </p>
        <button onClick={() => navigate("/admin/dashboard")}
          className="mt-2 px-6 py-3 bg-black text-white rounded-xl font-semibold text-sm">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/admin/dashboard")}
          className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-bold text-lg">{captain.firstname} {captain.lastname}</h1>
          <p className="text-xs text-gray-500">Captain Application</p>
        </div>
        <div className="ml-auto">
          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize
            ${captain.approval_status === "pending" ? "bg-orange-100 text-orange-700"
              : captain.approval_status === "approved" ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"}`}>
            {captain.approval_status}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: info */}
        <div className="space-y-6">
          {/* Personal info */}
          <Section title="Personal Information" icon={<User size={16} />}>
            <InfoRow label="Full Name" value={`${captain.firstname} ${captain.lastname}`} />
            <InfoRow label="Email" value={captain.email} icon={<Mail size={12} />} />
            <InfoRow label="Phone" value={captain.phone || "Not provided"} icon={<Phone size={12} />} />
            <InfoRow label="Payment" value={captain.registration_payment_paid ? "✓ KES 2,000 paid" : "✗ Not paid"}
              valueClass={captain.registration_payment_paid ? "text-green-600" : "text-red-600"} />
            <InfoRow label="Applied" value={new Date(captain.created_at).toLocaleString()} />
          </Section>

          {/* Vehicle info */}
          <Section title="Vehicle Details" icon={<Car size={16} />}>
            <InfoRow label="Type" value={captain.vehicle_type?.toUpperCase()} />
            <InfoRow label="Make & Model" value={`${captain.vehicle_make || "—"} ${captain.vehicle_model || ""} ${captain.vehicle_year || ""}`} />
            <InfoRow label="Color" value={captain.vehicle_color} />
            <InfoRow label="Plate Number" value={captain.vehicle_number} />
            <InfoRow label="Capacity" value={`${captain.vehicle_capacity || 1} seats`} />
          </Section>

          {/* Document numbers */}
          <Section title="Document Numbers" icon={<FileText size={16} />}>
            <InfoRow label="National ID No." value={captain.national_id_number || "Not provided"} />
            <InfoRow label="Licence No." value={captain.license_number || "Not provided"} />
          </Section>
        </div>

        {/* Right column: photos */}
        <div className="space-y-6">
          <Section title="Verification Photos" icon={<Camera size={16} />}>
            <PhotoCard label="National ID" url={kyc?.nationalIdUrl} onClick={() => setPreviewImg(kyc?.nationalIdUrl)} />
            <PhotoCard label="Driving Licence" url={kyc?.licenseUrl} onClick={() => setPreviewImg(kyc?.licenseUrl)} />
            <PhotoCard label="Selfie / Face Verification" url={kyc?.selfieUrl} onClick={() => setPreviewImg(kyc?.selfieUrl)} />
          </Section>

          {/* Action buttons */}
          {isPending && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Decision</h3>

              {!showRejectBox ? (
                <div className="flex gap-3">
                  <button onClick={approve} disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition disabled:opacity-60">
                    {actionLoading === "approve" ? "Approving…"
                      : <><CheckCircle size={16} /> Approve</>}
                  </button>
                  <button onClick={() => setShowRejectBox(true)} disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 transition disabled:opacity-60">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (captain will see this)"
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRejectBox(false)}
                      className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium">
                      Cancel
                    </button>
                    <button onClick={reject} disabled={!!actionLoading}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
                      {actionLoading === "reject" ? "Rejecting…" : "Confirm Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isPending && (
            <div className={`rounded-2xl border p-5 text-center
              ${captain.approval_status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="font-medium capitalize text-sm">
                {captain.approval_status === "approved" ? "✓ Approved" : "✗ Rejected"}
              </p>
              {captain.rejection_reason && (
                <p className="text-xs text-gray-500 mt-2">Reason: {captain.rejection_reason}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="Document" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" />
          <button onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2">
            <XCircle size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
        <span className="text-gray-500">{icon}</span>
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, icon, valueClass = "text-gray-800" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-400 flex items-center gap-1 min-w-28 flex-shrink-0">{icon}{label}</span>
      <span className={`text-sm font-medium text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

function PhotoCard({ label, url, onClick }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      {url ? (
        <div
          onClick={onClick}
          className="w-full h-44 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition bg-gray-100 border border-gray-200"
        >
          <img src={url} alt={label} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-44 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
          <p className="text-xs text-gray-400">Photo not available</p>
        </div>
      )}
    </div>
  );
}

export default CaptainDetailAdmin;
