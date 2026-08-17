import { useEffect, useState } from "react";
import axios from "axios";
import { MessageCircle, Search } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ChatList({ setActiveChat, activeChat }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("hrms_hr_Token");

  useEffect(() => {
    axios.get(`${BASE_URL}/chat/hr/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setClients(res.data.data || []))
    .catch(err => console.error(err));
  }, []);

  const openChat = async (client) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/chat/hr/start`,
        { clientId: client.id },
        { headers: { Authorization: `Bearer ${token}` } }
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

  const filtered = clients.filter(c =>
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 border-r flex flex-col bg-white">
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600">
        <h2 className="text-white font-bold text-lg mb-3">IT Chat</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-9 pr-3 py-2 bg-white/20 text-white placeholder-white/60 rounded-xl text-sm outline-none focus:bg-white/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Internal
        </div>
        {[
          { room: "hr-it", name: "HR Team", sub: "HR department" },
        ].map((c) => {
          const isActive = activeChat?.internal && activeChat?.room === c.room;
          return (
            <div
              key={c.room}
              onClick={() =>
                setActiveChat({ internal: true, room: c.room, name: c.name })
              }
              className={`p-4 border-b cursor-pointer transition-all ${
                isActive
                  ? "bg-amber-50 border-l-4 border-l-amber-500"
                  : "hover:bg-gray-50 border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {c.name}
                  </div>
                  <div className="text-xs text-gray-500">{c.sub}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Clients
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle size={40} className="mb-2 text-gray-200" />
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          filtered.map(client => {
            const isActive = activeChat?.company_name === client.company_name;
            return (
              <div
                key={client.id}
                onClick={() => openChat(client)}
                className={`p-4 border-b cursor-pointer transition-all ${
                  isActive ? "bg-purple-50 border-l-4 border-l-purple-500" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {client.company_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{client.company_name}</div>
                    <div className="text-xs text-gray-500">{client.client_name}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Connected</span>
        </div>
      </div>
    </div>
  );
}
