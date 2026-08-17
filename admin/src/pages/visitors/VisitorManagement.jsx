import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { UserCheck, LogOut, Search, DoorOpen } from "lucide-react";

export default function VisitorManagement() {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ today: 0, inside: 0 });
  const [employees, setEmployees] = useState([]);
  const [scope, setScope] = useState("today");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    purpose: "",
    host_employee_id: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await API.get(
        `/visitors?scope=${scope}&search=${encodeURIComponent(search)}`,
      );
      setVisitors(data.data);
      setStats(data.stats || { today: 0, inside: 0 });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load visitors");
    }
  }, [scope, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    API.get("/employees?limit=500")
      .then(({ data }) => setEmployees(data.data || data.employees || []))
      .catch(() => {});
  }, []);

  const checkIn = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.purpose.trim())
      return toast.error("Visitor name and purpose are required");
    setSaving(true);
    try {
      const { data } = await API.post("/visitors", {
        ...form,
        host_employee_id: form.host_employee_id || null,
      });
      toast.success(`${data.message} — badge ${data.badge_no}`);
      setForm({ name: "", phone: "", company: "", purpose: "", host_employee_id: "" });
      load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Check-in failed");
    } finally {
      setSaving(false);
    }
  };

  const checkOut = async (id) => {
    try {
      await API.patch(`/visitors/${id}/checkout`);
      toast.success("Visitor checked out");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Checkout failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DoorOpen className="text-indigo-600" size={26} />
            Visitor Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Front-desk check-in, host notification and visit history
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2">
            <span className="text-gray-400">Today</span>{" "}
            <span className="font-bold text-gray-900">{stats.today ?? 0}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2">
            <span className="text-gray-400">Inside now</span>{" "}
            <span className="font-bold text-emerald-600">{stats.inside ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Check-in form */}
      <form
        onSubmit={checkIn}
        className="bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Visitor name *"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Phone"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <input
          value={form.company}
          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          placeholder="Company"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <input
          value={form.purpose}
          onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
          placeholder="Purpose of visit *"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <select
          value={form.host_employee_id}
          onChange={(e) =>
            setForm((f) => ({ ...f, host_employee_id: e.target.value }))
          }
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Meeting whom? (host)</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
        <button
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          <UserCheck size={15} /> {saving ? "Checking in..." : "Check in visitor"}
        </button>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {["today", "inside", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
              scope === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {s === "inside" ? "Inside now" : s}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / company / host"
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b">
              <th className="py-2 pr-4">Badge</th>
              <th className="py-2 pr-4">Visitor</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Purpose</th>
              <th className="py-2 pr-4">Host</th>
              <th className="py-2 pr-4">Check-in</th>
              <th className="py-2 pr-4">Check-out</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr key={v.id} className="border-b border-gray-50">
                <td className="py-2 pr-4 font-mono text-xs text-gray-500">{v.badge_no}</td>
                <td className="py-2 pr-4">
                  <p className="font-medium text-gray-800">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.phone || "—"}</p>
                </td>
                <td className="py-2 pr-4 text-gray-600">{v.company || "—"}</td>
                <td className="py-2 pr-4 text-gray-600 max-w-[160px] truncate">{v.purpose}</td>
                <td className="py-2 pr-4 text-gray-600">{v.host_name || "—"}</td>
                <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                  {new Date(v.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {v.check_out ? (
                    <span className="text-gray-500">
                      {new Date(v.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      Inside
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {!v.check_out && (
                    <button
                      onClick={() => checkOut(v.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-500"
                    >
                      <LogOut size={13} /> Check out
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!visitors.length && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No visitors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
