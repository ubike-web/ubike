import { useEffect, useState } from "react";
import { ArrowLeft, TrendingUp, Clock, Wallet, Package, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CaptainWalletScreen() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/payment/captain-wallet`, { headers: { token } })
      .then(({ data }) => {
        setBalance(data.balance || 0);
        setPending(data.pending || 0);
        setTotalEarned(data.total_earned || 0);
        setTransactions(data.transactions || []);
      })
      .catch(() => setError("Could not load wallet data."))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

  const typeLabel = (type) => ({ escrow: "Held in escrow", payout: "Earned", refund: "Refunded" }[type] || type);
  const typeColor = (type) => ({ escrow: "bg-yellow-100 text-yellow-700", payout: "bg-green-100 text-green-700", refund: "bg-red-100 text-red-500" }[type] || "bg-gray-100 text-gray-600");

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <div className="p-4 flex gap-3 items-center border-b">
        <ArrowLeft strokeWidth={3} className="cursor-pointer flex-shrink-0" onClick={() => navigate(-1)} />
        <h1 className="text-2xl font-semibold">Earnings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Balance cards */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-black rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="opacity-70" />
              <span className="text-sm opacity-70">Available balance</span>
            </div>
            <h2 className="text-3xl font-bold">KES {loading ? "—" : fmt(balance)}</h2>
            <p className="text-xs opacity-40 mt-1">Ready for withdrawal</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={14} className="text-yellow-600" />
              <span className="text-xs text-yellow-700 font-medium">Pending</span>
            </div>
            <p className="text-xl font-bold text-yellow-800">KES {loading ? "—" : fmt(pending)}</p>
            <p className="text-xs text-yellow-600 mt-0.5">Held in escrow</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">All time</span>
            </div>
            <p className="text-xl font-bold text-green-800">KES {loading ? "—" : fmt(totalEarned)}</p>
            <p className="text-xs text-green-600 mt-0.5">Total earned</p>
          </div>
        </div>

        {/* How it works */}
        <div className="mx-4 mb-4 bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-800 mb-2">How payments work</p>
          <div className="space-y-1.5 text-xs text-blue-700">
            <p>1. Customer pays 50% when booking — shown as <strong>Pending</strong></p>
            <p>2. Ride completes → customer pays remaining 50%</p>
            <p>3. Full fare moves to your <strong>Available balance</strong></p>
          </div>
        </div>

        {/* Transaction history */}
        <div className="px-4">
          <h3 className="text-sm font-semibold mb-3">Transaction history</h3>
          {error && <p className="text-sm text-red-500 text-center py-4">{error}</p>}
          {loading ? (
            <p className="text-center text-zinc-400 text-sm py-8">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-8">No transactions yet</p>
          ) : (
            <div className="space-y-0 divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      {tx.ride?.vehicle === "bike" ? <Package size={15} /> : <Car size={15} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{typeLabel(tx.type)}</p>
                      {tx.description && (
                        <p className="text-xs text-zinc-400 truncate max-w-[160px]">{tx.description}</p>
                      )}
                      <p className="text-xs text-zinc-400">{fmtDate(tx.created_at)} · {fmtTime(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">KES {fmt(tx.amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor(tx.type)}`}>
                      {typeLabel(tx.type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaptainWalletScreen;
