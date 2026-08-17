import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, X, Plus } from "lucide-react";
import API from "../../services/api";

const badge = (s) =>
  s === "Approved"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : s === "Rejected"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    client_employee_id: "",
    leave_type: "Casual",
    from_date: "",
    to_date: "",
    reason: "",
  });

  const load = async () => {
    try {
      const [l, e] = await Promise.all([
        API.get("/client/leave-offer/leaves"),
        API.get("/client/search/employees?pageSize=100"),
      ]);
      setLeaves(l.data.data || []);
      setEmployees(e.data.data || []);
    } catch {
      setMsg("Failed to load leave data");
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/client/leave-offer/leaves", form);
      setShowForm(false);
      setForm({ client_employee_id: "", leave_type: "Casual", from_date: "", to_date: "", reason: "" });
      flash("Leave request recorded");
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to create leave");
    }
  };

  const decide = async (id, decision) => {
    setBusyId(id);
    try {
      await API.patch(`/client/leave-offer/leaves/${id}`, { decision });
      flash(`Leave ${decision.toLowerCase()}`);
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const rows = useMemo(
    () => (filter ? leaves.filter((l) => l.status === filter) : leaves),
    [leaves, filter]
  );
  const pending = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays size={20} className="text-indigo-600" /> Leave Approvals
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending} pending request{pending === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700"
          >
            <Plus size={15} /> New Request
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 text-sm px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
          {msg}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="mb-6 bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            required
            value={form.client_employee_id}
            onChange={(e) => setForm({ ...form, client_employee_id: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} {e.employeeCode ? `(${e.employeeCode})` : ""}</option>
            ))}
          </select>
          <select
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            <option>Casual</option><option>Sick</option><option>Earned</option><option>Unpaid</option>
          </select>
          <div className="flex gap-2">
            <input required type="date" value={form.from_date}
              onChange={(e) => setForm({ ...form, from_date: e.target.value })}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
            <input required type="date" value={form.to_date} min={form.from_date}
              onChange={(e) => setForm({ ...form, to_date: e.target.value })}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
          </div>
          <input
            value={form.reason} placeholder="Reason (optional)"
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="md:col-span-2 text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
          <button type="submit" className="text-sm font-medium px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
            Submit Request
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Days</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No leave requests</td></tr>
              )}
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{l.employee_name}</div>
                    <div className="text-xs text-gray-400">{l.employeeCode}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.leave_type}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(l.from_date).toLocaleDateString("en-IN")} - {new Date(l.to_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{Number(l.days)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{l.reason || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${badge(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.status === "Pending" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          disabled={busyId === l.id}
                          onClick={() => decide(l.id, "Approved")}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          disabled={busyId === l.id}
                          onClick={() => decide(l.id, "Rejected")}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {l.decided_at ? new Date(l.decided_at).toLocaleDateString("en-IN") : "-"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
