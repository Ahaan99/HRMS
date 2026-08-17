import { useEffect, useState } from "react";
import axios from "axios";
import { MessageCircle, Search } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ChatList({ setActiveChat, activeChat }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("hrms_hr_Token");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/chat/hr/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setClients(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  const openChat = async (client) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/chat/hr/start`,
        { clientId: client.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setActiveChat({
        conversation_id: res.data.conversationId,
        company_name: client.company_name,
        client_name: client.client_name,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex w-72 flex-col border-r border-slate-200 bg-white">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-slate-900 p-4">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-600/25 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
            Messaging
          </p>
          <h2 className="mb-3 mt-0.5 text-lg font-bold text-white">HR Chat</h2>
          <div className="relative">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-400 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>
        </div>
      </div>

      {/* ── LISTS ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Internal
        </div>
        {[{ room: "hr-it", name: "IT Team", sub: "IT department" }].map((c) => {
          const isActive = activeChat?.internal && activeChat?.room === c.room;
          return (
            <div
              key={c.room}
              onClick={() =>
                setActiveChat({ internal: true, room: c.room, name: c.name })
              }
              className={`cursor-pointer border-b border-l-4 border-b-slate-100 p-4 transition-colors ${
                isActive
                  ? "border-l-amber-500 bg-amber-50"
                  : "border-l-transparent hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-600 ring-1 ring-amber-100">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {c.name}
                  </div>
                  <div className="text-xs text-slate-500">{c.sub}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Clients
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-slate-400">
            <MessageCircle
              size={36}
              aria-hidden="true"
              className="mb-2 text-slate-200"
            />
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          filtered.map((client) => {
            const isActive = activeChat?.company_name === client.company_name;
            return (
              <div
                key={client.id}
                onClick={() => openChat(client)}
                className={`cursor-pointer border-b border-l-4 border-b-slate-100 p-4 transition-colors ${
                  isActive
                    ? "border-l-indigo-500 bg-indigo-50"
                    : "border-l-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600 ring-1 ring-indigo-100">
                    {client.company_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {client.company_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {client.client_name}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <div className="border-t border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Connected</span>
        </div>
      </div>
    </div>
  );
}
