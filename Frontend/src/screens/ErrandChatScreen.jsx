import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import axios from "axios";
import { SocketDataContext } from "../contexts/SocketContext";

function ErrandChatScreen() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const { socket } = useContext(SocketDataContext);
  const token = localStorage.getItem("token");
  const role = new URLSearchParams(window.location.search).get("role") || "user";

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const url = role === "captain"
      ? `${import.meta.env.VITE_SERVER_URL}/errand/chat/captain/${subscriptionId}`
      : `${import.meta.env.VITE_SERVER_URL}/errand/chat/${subscriptionId}`;
    axios.get(url, { headers: { token } })
      .then(({ data }) => setMessages(data.chats || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    socket.on("errand-message", (data) => {
      if (data.subscriptionId === subscriptionId) {
        setMessages(prev => [...prev, {
          sender_type: data.senderType,
          message: data.message,
          sent_at: data.sentAt,
          id: Date.now(),
        }]);
      }
    });

    return () => socket.off("errand-message");
  }, [subscriptionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const optimistic = { sender_type: role, message: trimmed, sent_at: new Date().toISOString(), id: `opt-${Date.now()}` };
    setMessages(prev => [...prev, optimistic]);
    setText("");
    setSending(true);
    try {
      const url = role === "captain"
        ? `${import.meta.env.VITE_SERVER_URL}/errand/chat/captain/send`
        : `${import.meta.env.VITE_SERVER_URL}/errand/chat/send`;
      await axios.post(url, { subscriptionId, message: trimmed }, { headers: { token } });
    } catch {
      // keep the optimistic message
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-white">
      <div className="p-4 border-b flex items-center gap-3 bg-white z-10">
        <ArrowLeft strokeWidth={3} className="cursor-pointer flex-shrink-0" onClick={() => navigate(-1)} />
        <div>
          <h1 className="font-semibold text-base leading-5">Errand Chat</h1>
          <p className="text-xs text-gray-400">{role === "captain" ? "Subscriber conversation" : "Chat with your rider"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading && <p className="text-center text-sm text-gray-400 animate-pulse py-8">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-2 py-12">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Say hello to get started!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.sender_type === role;
          return (
            <div key={msg.id || i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isOwn ? "bg-black text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-0.5 ${isOwn ? "text-white/50" : "text-gray-400"}`}>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t flex gap-2 bg-white">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export default ErrandChatScreen;
