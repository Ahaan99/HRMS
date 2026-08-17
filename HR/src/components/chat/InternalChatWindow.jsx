import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Send, Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TYPE_LABEL = { hr: "HR", it: "IT", superadmin: "Superadmin" };
const TYPE_COLOR = {
  hr: "text-pink-600",
  it: "text-indigo-600",
  superadmin: "text-amber-600",
};

export default function InternalChatWindow({ activeChat, myType }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const firstLoadRef = useRef(true);
  const token = localStorage.getItem("hrms_hr_Token");

  const room = activeChat?.room;

  const load = async () => {
    if (!room) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/chat/internal/${room}?senderType=${myType}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessages(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    firstLoadRef.current = true;
    setMessages([]);
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [room]);

  useEffect(() => {
    if (firstLoadRef.current) {
      bottomRef.current?.scrollIntoView();
      firstLoadRef.current = false;
      return;
    }
    const container = bottomRef.current?.parentElement;
    if (!container) return;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      120;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/chat/internal/send`,
        { room, message: text.trim(), senderType: myType },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.data) setMessages((prev) => [...prev, res.data.data]);
      setText("");
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      sendMessage();
    }
  };

  const fmt = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const dayLabel = (d) => {
    const date = new Date(d);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yest.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!activeChat) return null;

  let lastDay = null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* header */}
      <div className="h-16 flex items-center px-5 border-b bg-white gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
          {activeChat.name?.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-gray-800">{activeChat.name}</div>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
            Online
          </div>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-4 bg-[#eae6df]">
        {messages.map((msg, index) => {
          const isMine = msg.sender_type === myType;
          const day = dayLabel(msg.created_at);
          const showDay = day !== lastDay;
          lastDay = day;

          return (
            <div key={msg.id || index}>
              {showDay && (
                <div className="flex justify-center my-3">
                  <span className="bg-white text-gray-500 text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">
                    {day}
                  </span>
                </div>
              )}
              <div
                className={`flex mb-1.5 ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[70%] px-3 py-1.5 shadow-sm text-sm leading-relaxed ${
                    isMine
                      ? "bg-[#d9fdd3] text-gray-900 rounded-lg rounded-tr-none"
                      : "bg-white text-gray-900 rounded-lg rounded-tl-none"
                  }`}
                >
                  {!isMine && (
                    <div
                      className={`text-[11px] font-semibold mb-0.5 ${TYPE_COLOR[msg.sender_type] || "text-gray-500"}`}
                    >
                      {TYPE_LABEL[msg.sender_type] || msg.sender_type}
                    </div>
                  )}
                  <span className="whitespace-pre-line break-words align-middle">
                    {msg.message}
                  </span>
                  <span className="inline-block float-right ml-2 mt-2 text-[10px] text-gray-500 select-none">
                    {fmt(msg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="px-4 py-3 bg-[#f0f2f5] border-t shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message"
            className="flex-1 bg-white border border-transparent rounded-full px-5 py-2.5 outline-none focus:border-purple-300 text-sm shadow-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-gray-300 disabled:to-gray-300 text-white transition shrink-0"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={19} />
            ) : (
              <Send size={19} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
