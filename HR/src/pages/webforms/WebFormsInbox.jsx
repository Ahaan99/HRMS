import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Inbox, UserPlus, Archive, MailOpen, Globe } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_hr_Token")}`,
});

const TYPE_LABELS = {
  contact: "Contact",
  job_application: "Job Application",
  enquiry: "Enquiry",
  demo_request: "Demo Request",
  vendor_registration: "Vendor Registration",
  employee_new_joining: "New Joining",
};

const STATUS_COLORS = {
  New: "bg-blue-50 text-blue-600",
  Read: "bg-gray-100 text-gray-600",
  Converted: "bg-emerald-50 text-emerald-600",
  Archived: "bg-amber-50 text-amber-600",
};

export default function WebFormsInbox() {
  const [subs, setSubs] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/web-forms/submissions${filter ? `?status=${filter}` : ""}`,
        { headers: authHeaders() },
      );
      setSubs(data.submissions || []);
      setCounts(data.counts || {});
    } catch (err) {
      toast.error(err?.response?.data?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await axios.patch(
        `${BASE_URL}/web-forms/submissions/${id}/status`,
        { status },
        { headers: authHeaders() },
      );
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const convert = async (id) => {
    try {
      await axios.post(
        `${BASE_URL}/web-forms/submissions/${id}/convert`,
        {},
        { headers: authHeaders() },
      );
      toast.success("Converted to candidate");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Convert failed");
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-black text-white">
          <Globe size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Website Forms</h1>
          <p className="text-sm text-gray-500">
            {counts.total || 0} submissions &middot; {counts.unread || 0} new
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "New", "Read", "Converted", "Archived"].map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
              filter === f ? "bg-black text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{s.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                    {TYPE_LABELS[s.form_type] || s.form_type}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.email || "no email"} &middot; {s.phone || "no phone"} &middot;{" "}
                  {new Date(s.created_at).toLocaleString()} &middot; via {s.source}
                </p>
                {s.subject && (
                  <p className="text-sm font-semibold text-gray-700 mt-2">{s.subject}</p>
                )}
                {s.message && (
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{s.message}</p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {s.status === "New" && (
                  <button
                    onClick={() => setStatus(s.id, "Read")}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    title="Mark read"
                    aria-label="Mark read"
                  >
                    <MailOpen size={15} />
                  </button>
                )}
                {s.status !== "Converted" && (
                  <button
                    onClick={() => convert(s.id)}
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    title="Convert to candidate"
                    aria-label="Convert to candidate"
                  >
                    <UserPlus size={15} />
                  </button>
                )}
                {s.status !== "Archived" && (
                  <button
                    onClick={() => setStatus(s.id, "Archived")}
                    className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                    title="Archive"
                    aria-label="Archive"
                  >
                    <Archive size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && subs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Inbox size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No submissions yet</p>
            <p className="text-sm">Submissions from company websites will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
