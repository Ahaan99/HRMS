import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const STATUS_STYLE = {
  SENT: "bg-emerald-100 text-emerald-700",
  SIMULATED: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function MessagingCenter() {
  const [status, setStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sendForm, setSendForm] = useState({
    channel: "SMS",
    recipient: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, t, l] = await Promise.all([
        API.get("/messaging/status"),
        API.get("/messaging/templates"),
        API.get("/messaging/logs?limit=50"),
      ]);
      setStatus(s.data);
      setTemplates(t.data.data);
      setLogs(l.data.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load messaging data");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sendTest = async (e) => {
    e.preventDefault();
    if (!sendForm.recipient.trim() || !sendForm.message.trim())
      return toast.error("Recipient and message are required");
    setSending(true);
    try {
      const { data } = await API.post("/messaging/send", sendForm);
      toast[data.status === "FAILED" ? "error" : "success"](data.message);
      setSendForm((f) => ({ ...f, message: "" }));
      load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const saveTemplate = async (tpl) => {
    try {
      await API.put(`/messaging/templates/${tpl.id}`, {
        body: tpl.body,
        channel: tpl.channel,
        is_active: tpl.is_active,
      });
      toast.success("Template saved");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-indigo-600" size={26} />
            WhatsApp / SMS Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated notifications, manual sends and delivery logs
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Provider status */}
      {status && (
        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 ${
            status.mode === "LIVE"
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          {status.mode === "LIVE" ? (
            <CheckCircle2 className="text-emerald-600" size={22} />
          ) : (
            <AlertTriangle className="text-amber-600" size={22} />
          )}
          <div className="text-sm">
            <p className="font-semibold text-gray-800">
              {status.mode === "LIVE" ? "Live delivery enabled" : "Simulation mode"}
            </p>
            <p className="text-gray-600">
              SMS (Twilio): {status.sms.configured ? "configured" : "not configured"} ·
              WhatsApp Cloud API: {status.whatsapp.configured ? "configured" : "not configured"}
              {status.mode !== "LIVE" &&
                " — messages are logged but not delivered. Add TWILIO_* / WHATSAPP_* keys in backend .env to go live."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual send */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Send a message</h2>
          <form onSubmit={sendTest} className="space-y-3">
            <div className="flex gap-3">
              <select
                value={sendForm.channel}
                onChange={(e) =>
                  setSendForm((f) => ({ ...f, channel: e.target.value }))
                }
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <input
                value={sendForm.recipient}
                onChange={(e) =>
                  setSendForm((f) => ({ ...f, recipient: e.target.value }))
                }
                placeholder="Phone number e.g. +9198xxxxxx"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={sendForm.message}
              onChange={(e) =>
                setSendForm((f) => ({ ...f, message: e.target.value }))
              }
              rows={3}
              placeholder="Message text"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <button
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              <Send size={15} /> {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Event templates{" "}
            <span className="text-xs font-normal text-gray-400">
              (auto-sent on system events)
            </span>
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {templates.map((t) => (
              <div key={t.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {t.name}{" "}
                    <span className="text-xs text-gray-400">({t.event_key})</span>
                  </p>
                  <button
                    onClick={() =>
                      setEditing(editing?.id === t.id ? null : { ...t })
                    }
                    className="text-xs text-indigo-600 font-medium"
                  >
                    {editing?.id === t.id ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editing?.id === t.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editing.body}
                      onChange={(e) =>
                        setEditing((ed) => ({ ...ed, body: e.target.value }))
                      }
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={editing.channel}
                        onChange={(e) =>
                          setEditing((ed) => ({ ...ed, channel: e.target.value }))
                        }
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="BOTH">SMS + WhatsApp</option>
                        <option value="SMS">SMS only</option>
                        <option value="WHATSAPP">WhatsApp only</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={!!editing.is_active}
                          onChange={(e) =>
                            setEditing((ed) => ({
                              ...ed,
                              is_active: e.target.checked ? 1 : 0,
                            }))
                          }
                        />
                        Active
                      </label>
                      <button
                        onClick={() => saveTemplate(editing)}
                        className="ml-auto px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Delivery log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Message</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{l.channel}</td>
                  <td className="py-2 pr-4">{l.recipient}</td>
                  <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">
                    {l.body}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[l.status]}`}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No messages sent yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
