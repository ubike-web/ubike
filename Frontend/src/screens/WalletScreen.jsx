import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";
import { usePaystack } from "../hooks/usePaystack";

function WalletScreen() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData"));
  const user = userData?.data;
  const { pay } = usePaystack();

  const [transactions, setTransactions] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/payment/wallet`,
        { headers: { token } }
      );
      setTransactions(data.transactions);
      setTotalSpent(data.totalSpent);
    } catch (err) {
      setError("Could not load wallet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!amount || amount < 10) {
      setError("Minimum top-up is KES 10");
      return;
    }
    setError("");
    setTopupLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/payment/initialize`,
        { amount, email: user.email, description: "U-bike wallet top-up" },
        { headers: { token } }
      );

      pay({
        email: user.email,
        amount,
        onSuccess: async (reference) => {
          try {
            await axios.post(
              `${import.meta.env.VITE_SERVER_URL}/payment/topup`,
              { reference, amount },
              { headers: { token } }
            );
          } catch (_) {}
          setTopupAmount("");
          fetchWallet();
        },
        onClose: () => {},
      });
    } catch (err) {
      setError("Could not initialise top-up. Try again.");
    } finally {
      setTopupLoading(false);
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  };

  const halfLabel = (half) => {
    if (half === "first") return "1st payment";
    if (half === "second") return "2nd payment";
    return "Top-up";
  };

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <div className="p-4 flex gap-3 items-center border-b">
        <ArrowLeft strokeWidth={3} className="cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="text-2xl font-semibold">Wallet</h1>
      </div>

      {/* Balance card */}
      <div className="mx-4 mt-4 bg-black rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={18} />
          <span className="text-sm opacity-70">Total spent</span>
        </div>
        <h2 className="text-3xl font-bold">
          KES {loading ? "—" : totalSpent.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <p className="text-xs opacity-50 mt-1">{transactions.filter(t => t.status === "success").length} successful payments</p>
      </div>

      {/* Top-up */}
      <div className="mx-4 mt-4">
        <h3 className="text-sm font-semibold mb-2">Top up via Paystack</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="Amount (KES)"
            className="flex-1 bg-zinc-100 px-4 py-2 rounded-lg outline-none text-sm"
            min={10}
          />
          <Button
            title="Pay"
            loading={topupLoading}
            fun={handleTopup}
            classes="!w-auto px-5 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* Transactions */}
      <div className="flex-1 overflow-y-auto mx-4 mt-4 pb-4">
        <h3 className="text-sm font-semibold mb-2">Transaction history</h3>
        {loading ? (
          <p className="text-center text-zinc-400 text-sm py-8">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-8">No transactions yet</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between border-b py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium capitalize">
                    {tx.ride
                      ? `${halfLabel(tx.half)} – ${tx.ride.vehicle}`
                      : halfLabel(tx.half)}
                  </p>
                  {tx.ride && (
                    <p className="text-xs text-zinc-400 truncate max-w-[160px]">
                      {tx.ride.pickup?.split(", ")[0]} → {tx.ride.destination?.split(", ")[0]}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400">{formatDate(tx.created_at)} · {formatTime(tx.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">KES {Number(tx.amount).toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WalletScreen;
