import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, CreditCard, Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CaptainErrandHistory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [errands, setErrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/errand/my-deliveries`, { headers: { token } })
      .then(({ data }) => setErrands(data.errands || data || []))
      .catch(() => setErrands([]))
      .finally(() => setLoading(false));
  }, []);

  function classifyAndSort(items) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isToday = (d) => d.toDateString() === today.toDateString();
    const isYesterday = (d) => d.toDateString() === yesterday.toDateString();

    const sortByDate = (arr) => arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const todayItems = [], yesterdayItems = [], earlierItems = [];
    items.forEach((item) => {
      const d = new Date(item.created_at);
      if (isToday(d)) todayItems.push(item);
      else if (isYesterday(d)) yesterdayItems.push(item);
      else earlierItems.push(item);
    });

    return { today: sortByDate(todayItems), yesterday: sortByDate(yesterdayItems), earlier: sortByDate(earlierItems) };
  }

  const classified = classifyAndSort(errands);

  return (
    <div className="p-4 h-dvh flex flex-col">
      <div className="flex gap-3 mb-4">
        <ArrowLeft strokeWidth={3} className="mt-[4px] cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="text-2xl font-semibold">Errand History</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : errands.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Package size={40} className="text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No deliveries yet</p>
          <p className="text-xs text-gray-400 mt-1">Your errand history will appear here</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {[
            { label: "Today", items: classified.today },
            { label: "Yesterday", items: classified.yesterday },
            { label: "Earlier", items: classified.earlier },
          ].map(({ label, items }) => (
            <details key={label} open className="group mb-2">
              <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-semibold mb-2 select-none">
                <span>{label}</span>
                <span className="text-xs font-normal text-gray-400">{items.length} deliveries</span>
              </summary>
              {items.length > 0 ? (
                items.map((e) => <ErrandCard key={e.id || e._id} errand={e} />)
              ) : (
                <p className="text-sm text-center text-zinc-600 mb-3">No deliveries</p>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrandCard({ errand }) {
  const d = new Date(errand.created_at);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const date = `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  let h = d.getHours(), m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${h}:${m < 10 ? "0" + m : m} ${period}`;

  const statusColors = {
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
    pending: "bg-orange-100 text-orange-700",
    accepted: "bg-blue-100 text-blue-700",
    picked_up: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="w-full px-3 py-3 border-2 mb-2 rounded-xl relative">
      <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[errand.status] || "bg-gray-100 text-gray-600"}`}>
        {errand.status?.replace("_", " ")}
      </span>

      <div className="flex items-center gap-2 mb-2">
        <Package size={14} className="text-orange-500 flex-shrink-0" />
        <p className="text-sm font-semibold truncate pr-16">{errand.item_name || "Package"}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <span className="text-xs flex gap-1 items-center text-gray-600">
          <Calendar size={11} /> {date}
        </span>
        <span className="text-xs flex gap-1 items-center text-gray-600">
          <Clock size={11} /> {time}
        </span>
        <span className="text-xs flex gap-1 items-center font-semibold">
          <CreditCard size={11} /> KES {errand.fare || 0}
        </span>
      </div>

      <div className="bg-zinc-100 w-full h-[1px] mb-2" />

      <div className="flex items-start relative w-full">
        <div className="w-[2px] bg-dashed border-l-2 border-dashed border-orange-300 absolute left-1.5 top-1 bottom-1" />
        <div className="ml-5 truncate w-full space-y-0.5">
          <p className="text-xs text-zinc-600 truncate" title={errand.pickup}>
            <span className="text-orange-400 font-bold mr-1">▲</span>{errand.pickup}
          </p>
          <p className="text-xs text-zinc-600 truncate" title={errand.destination}>
            <span className="text-black font-bold mr-1">■</span>{errand.destination}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CaptainErrandHistory;
