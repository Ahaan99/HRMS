import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  ArrowRight,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import API from "../../services/api";

// =========================
// HELPERS
// =========================
const asArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.list)) return d.list;
  return [];
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const STATUS_TONE = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  ABSENT: "bg-red-50 text-red-700",
  HALF_DAY: "bg-amber-50 text-amber-700",
  LEAVE: "bg-blue-50 text-blue-700",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

function Tone({ value }) {
  const key = String(value || "").toUpperCase().replace(/\s+/g, "_");
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
        STATUS_TONE[key] || "bg-gray-100 text-gray-600"
      }`}
    >
      {value || "-"}
    </span>
  );
}

// =========================
// STAT CARD
// =========================
function StatCard({ icon: Icon, label, value, sub, to }) {
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-2xl font-extrabold text-gray-900 leading-tight">
          {value}
        </div>
        {sub && <div className="text-xs text-gray-400 truncate">{sub}</div>}
      </div>
    </Link>
  );
}

// =========================
// PANEL
// =========================
function Panel({ title, to, toLabel, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {to && (
          <Link
            to={to}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
          >
            {toLabel || "View all"} <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div className="max-h-[260px] overflow-y-auto overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

// =========================
// OVERVIEW PAGE
// =========================
export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const [emp, att, lev, intv, inv] = await Promise.allSettled([
        API.get("/client/employees"),
        API.get("/client/attendance"),
        API.get("/client/leave-offer/leaves"),
        API.get("/client/interviews"),
        API.get("/client/invoices"),
      ]);

      if (!alive) return;
      if (emp.status === "fulfilled") setEmployees(asArray(emp.value));
      if (att.status === "fulfilled") setAttendance(asArray(att.value));
      if (lev.status === "fulfilled") setLeaves(asArray(lev.value));
      if (intv.status === "fulfilled") setInterviews(asArray(intv.value));
      if (inv.status === "fulfilled") setInvoices(asArray(inv.value));
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ---- derived stats ----
  const today = todayStr();
  const todayRows = attendance.filter((a) =>
    String(a.date || a.attendance_date || "").slice(0, 10) === today
  );
  const presentToday = todayRows.filter(
    (a) => String(a.status || "").toUpperCase() === "PRESENT"
  ).length;

  const pendingLeaves = leaves.filter(
    (l) => String(l.status || "").toUpperCase() === "PENDING"
  );

  const deptCounts = employees.reduce((acc, e) => {
    const d = e.department_name || e.department || "Unassigned";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const deptList = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const maxDept = deptList.length ? deptList[0][1] : 1;

  if (loading) {
    return (
      <div>
        <PageHeader title="Overview" desc="Loading your workspace..." />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Overview"
        desc="A live snapshot of your workforce, attendance, and approvals."
      />

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Employees"
          value={employees.length}
          sub={`${deptList.length} departments`}
          to="/employees"
        />
        <StatCard
          icon={CalendarCheck}
          label="Present Today"
          value={presentToday}
          sub={`${todayRows.length} marked today`}
          to="/attendance"
        />
        <StatCard
          icon={CalendarClock}
          label="Pending Leaves"
          value={pendingLeaves.length}
          sub={`${leaves.length} total requests`}
          to="/leave-approvals"
        />
        <StatCard
          icon={ClipboardList}
          label="Interviews"
          value={interviews.length}
          sub="Tracked in pipeline"
          to="/interviews"
        />
        <StatCard
          icon={FileText}
          label="Invoices"
          value={invoices.length}
          sub="All invoices"
          to="/invoices"
        />
      </div>

      {/* ===== PANELS ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Departments */}
        <Panel title="Team by Department" to="/employees">
          {deptList.length === 0 && (
            <p className="text-sm text-gray-400">No employees yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {deptList.map(([dept, count]) => (
              <div key={dept}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">{dept}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-900"
                    style={{ width: `${(count / maxDept) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Pending leaves */}
        <Panel title="Leave Requests" to="/leave-approvals">
          {leaves.length === 0 && (
            <p className="text-sm text-gray-400">No leave requests.</p>
          )}
          <table className="w-full min-w-[280px] text-sm">
            <tbody>
              {leaves.slice(0, 8).map((l, i) => (
                <tr key={l.id ?? i} className="border-b border-gray-50">
                  <td className="py-2 pr-2 font-semibold text-gray-800 whitespace-nowrap">
                    {l.employee_name || l.name || `#${l.employee_id}`}
                    <div className="text-[11px] font-normal text-gray-400">
                      {l.leave_type || l.type || ""}
                    </div>
                  </td>
                  <td className="py-2 pr-2 text-xs text-gray-500 whitespace-nowrap">
                    {String(l.from_date || l.start_date || "").slice(0, 10)}
                  </td>
                  <td className="py-2 text-right">
                    <Tone value={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Recent attendance */}
        <Panel title="Recent Attendance" to="/attendance">
          {attendance.length === 0 && (
            <p className="text-sm text-gray-400">No attendance records.</p>
          )}
          <table className="w-full min-w-[280px] text-sm">
            <tbody>
              {attendance.slice(0, 8).map((a, i) => (
                <tr key={a.id ?? i} className="border-b border-gray-50">
                  <td className="py-2 pr-2 font-semibold text-gray-800 whitespace-nowrap">
                    {a.employee_name || a.name || `#${a.employee_id}`}
                  </td>
                  <td className="py-2 pr-2 text-xs text-gray-500 whitespace-nowrap">
                    {String(a.date || a.attendance_date || "").slice(0, 10)}
                  </td>
                  <td className="py-2 text-right">
                    <Tone value={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
