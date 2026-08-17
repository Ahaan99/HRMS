import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ExportButton from "../../components/common/ExportButton";
import {
  Code2,
  Bug,
  Clock,
  Rocket,
  Flag,
  BarChart3,
  Plus,
  X,
  Trash2,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TASK_STATUSES = ["Backlog", "In Progress", "Code Review", "Testing", "Done"];
const REVIEW_STATUSES = ["Not Submitted", "Pending Review", "Changes Requested", "Approved"];
const BUG_STATUSES = ["Open", "In Progress", "Fixed", "Verified", "Closed", "Reopened"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const MS_STATUSES = ["Planned", "On Track", "At Risk", "Delayed", "Completed"];
const ENVIRONMENTS = ["Development", "Staging", "Production"];

const PILL = {
  Backlog: "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "Code Review": "bg-violet-100 text-violet-700",
  Testing: "bg-amber-100 text-amber-700",
  Done: "bg-emerald-100 text-emerald-700",
  Open: "bg-red-100 text-red-700",
  Fixed: "bg-emerald-100 text-emerald-700",
  Verified: "bg-teal-100 text-teal-700",
  Closed: "bg-gray-100 text-gray-500",
  Reopened: "bg-orange-100 text-orange-700",
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
  Planned: "bg-gray-100 text-gray-600",
  "On Track": "bg-emerald-100 text-emerald-700",
  "At Risk": "bg-amber-100 text-amber-700",
  Delayed: "bg-red-100 text-red-700",
  Completed: "bg-teal-100 text-teal-700",
  Success: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  "Rolled Back": "bg-orange-100 text-orange-700",
  "Not Submitted": "bg-gray-100 text-gray-500",
  "Pending Review": "bg-blue-100 text-blue-700",
  "Changes Requested": "bg-orange-100 text-orange-700",
  Approved: "bg-emerald-100 text-emerald-700",
};

const Pill = ({ value }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PILL[value] || "bg-gray-100 text-gray-600"}`}>
    {value}
  </span>
);

const TABS = [
  { key: "tasks", label: "Tasks", icon: Code2 },
  { key: "bugs", label: "Bugs", icon: Bug },
  { key: "timesheets", label: "Timesheets", icon: Clock },
  { key: "deployments", label: "Deployments", icon: Rocket },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "performance", label: "Performance", icon: BarChart3 },
];

export default function ItDevDashboard() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [perf, setPerf] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState(null);

  const [modal, setModal] = useState(null); // 'task' | 'bug' | 'time' | 'deploy' | 'milestone'
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try {
      const [t, b, ts, d, m, p, emp] = await Promise.all([
        axios.get(`${BASE_URL}/itdev/tasks`, { headers }),
        axios.get(`${BASE_URL}/itdev/bugs`, { headers }),
        axios.get(`${BASE_URL}/itdev/timesheets`, { headers }),
        axios.get(`${BASE_URL}/itdev/deployments`, { headers }),
        axios.get(`${BASE_URL}/itdev/milestones`, { headers }),
        axios.get(`${BASE_URL}/itdev/performance`, { headers }),
        axios.get(`${BASE_URL}/finance/employees-expense`, { headers }),
      ]);
      setTasks(t.data || []);
      setBugs(b.data || []);
      setTimesheets(ts.data || []);
      setDeployments(d.data || []);
      setMilestones(m.data || []);
      setPerf(p.data || null);
      setEmployees(Array.isArray(emp.data) ? emp.data : []);
    } catch (err) {
      console.error("ITDev load error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const openModal = (kind) => {
    setForm({});
    setModal(kind);
  };

  const submitModal = async () => {
    const endpoints = {
      task: "tasks",
      bug: "bugs",
      time: "timesheets",
      deploy: "deployments",
      milestone: "milestones",
    };
    try {
      await axios.post(`${BASE_URL}/itdev/${endpoints[modal]}`, form, { headers });
      setModal(null);
      flash("success", "Saved");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Save failed");
    }
  };

  const patch = async (kind, id, body) => {
    try {
      await axios.put(`${BASE_URL}/itdev/${kind}/${id}`, body, { headers });
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Update failed");
    }
  };

  const remove = async (kind, id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await axios.delete(`${BASE_URL}/itdev/${kind}/${id}`, { headers });
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Delete failed");
    }
  };

  const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
  const fmtDT = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

  const exportData =
    { tasks, bugs, timesheets, deployments, milestones, performance: perf?.taskStats || [] }[tab] || [];

  const addButton = {
    tasks: ["task", "New Task"],
    bugs: ["bug", "Report Bug"],
    timesheets: ["time", "Log Time"],
    deployments: ["deploy", "Log Deployment"],
    milestones: ["milestone", "New Milestone"],
  }[tab];

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm";

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Code2 className="text-indigo-600" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">IT Developer Dashboard</h1>
            <p className="text-sm text-gray-500">
              Tasks, bugs, timesheets, deployments and milestone tracking.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <ExportButton data={exportData} filename={`itdev-${tab}`} />
          {addButton && (
            <button
              onClick={() => openModal(addButton[0])}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold"
            >
              <Plus size={16} /> {addButton[1]}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* KPI */}
      {perf?.counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Open Tasks", perf.counts.open_tasks, "text-blue-600 bg-blue-50"],
            ["Open Bugs", perf.counts.open_bugs, "text-red-600 bg-red-50"],
            ["In Code Review", perf.counts.in_review, "text-violet-600 bg-violet-50"],
            ["Deployments (30d)", perf.counts.deployments_30d, "text-emerald-600 bg-emerald-50"],
          ].map(([label, value, cls]) => (
            <div key={label} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
              <p className={`text-2xl font-bold mt-1.5 inline-block px-2.5 py-0.5 rounded-lg ${cls}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === key
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* TASKS */}
      {tab === "tasks" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Task</th>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Assignee</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Code Review</th>
                <th className="px-4 py-3 text-left font-semibold">Due</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.project || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{t.assignee || "-"}</td>
                  <td className="px-4 py-3"><Pill value={t.priority} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => patch("tasks", t.id, { status: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.review_status}
                      onChange={(e) => patch("tasks", t.id, { review_status: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    >
                      {REVIEW_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmt(t.due_date)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove("tasks", t.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!tasks.length && (
                <tr><td colSpan="8" className="px-5 py-10 text-center text-gray-400">No tasks yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BUGS */}
      {tab === "bugs" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Bug</th>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Severity</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Assignee</th>
                <th className="px-4 py-3 text-left font-semibold">Reported By</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{b.title}</p>
                    {b.description && <p className="text-xs text-gray-400 truncate max-w-xs">{b.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.project || "-"}</td>
                  <td className="px-4 py-3"><Pill value={b.severity} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => patch("bugs", b.id, { status: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    >
                      {BUG_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.assignee || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{b.reported_by || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove("bugs", b.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!bugs.length && (
                <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">No bugs reported</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TIMESHEETS */}
      {tab === "timesheets" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Developer</th>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-right font-semibold">Hours</th>
                <th className="px-4 py-3 text-left font-semibold">Summary</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((ts) => (
                <tr key={ts.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmt(ts.work_date)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{ts.employee || `#${ts.employee_id}`}</td>
                  <td className="px-4 py-3 text-gray-600">{ts.project || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(ts.hours)}</td>
                  <td className="px-4 py-3 text-gray-500">{ts.summary || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove("timesheets", ts.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!timesheets.length && (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-400">No time logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DEPLOYMENTS */}
      {tab === "deployments" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Version</th>
                <th className="px-4 py-3 text-left font-semibold">Environment</th>
                <th className="px-4 py-3 text-left font-semibold">Features</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">By / When</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{d.project}</td>
                  <td className="px-4 py-3 text-gray-700">{d.version_tag || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{d.environment}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{d.features || "-"}</td>
                  <td className="px-4 py-3"><Pill value={d.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {d.deployed_by || "-"}<br />{fmtDT(d.deployed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove("deployments", d.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!deployments.length && (
                <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">No deployments logged</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MILESTONES */}
      {tab === "milestones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl shadow border border-gray-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-indigo-500 uppercase">{m.project}</p>
                  <p className="font-bold text-gray-900">{m.title}</p>
                </div>
                <button onClick={() => remove("milestones", m.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Pill value={m.status} />
                <span className="text-xs text-gray-500">Target: {fmt(m.target_date)}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{m.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      m.progress >= 100 ? "bg-emerald-500" : m.status === "At Risk" || m.status === "Delayed" ? "bg-red-400" : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min(m.progress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={m.progress}
                  onBlur={(e) => Number(e.target.value) !== m.progress && patch("milestones", m.id, { progress: e.target.value })}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs"
                />
                <select
                  value={m.status}
                  onChange={(e) => patch("milestones", m.id, { status: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                >
                  {MS_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {m.notes && <p className="text-xs text-gray-400">{m.notes}</p>}
            </div>
          ))}
          {!milestones.length && (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-400">
              No milestones yet
            </div>
          )}
        </div>
      )}

      {/* PERFORMANCE */}
      {tab === "performance" && perf && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">Tasks by Developer</div>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Developer</th>
                  <th className="px-4 py-2.5 text-right">Done / Total</th>
                  <th className="px-4 py-2.5 text-right">Approved</th>
                </tr>
              </thead>
              <tbody>
                {perf.taskStats.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{r.developer}</td>
                    <td className="px-4 py-2.5 text-right">{r.done}/{r.total_tasks}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{r.approved_reviews}</td>
                  </tr>
                ))}
                {!perf.taskStats.length && (
                  <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">Bugs Fixed</div>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Developer</th>
                  <th className="px-4 py-2.5 text-right">Fixed / Assigned</th>
                </tr>
              </thead>
              <tbody>
                {perf.bugStats.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{r.developer}</td>
                    <td className="px-4 py-2.5 text-right">{r.fixed}/{r.assigned}</td>
                  </tr>
                ))}
                {!perf.bugStats.length && (
                  <tr><td colSpan="2" className="px-4 py-8 text-center text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">Hours (Last 30 Days)</div>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Developer</th>
                  <th className="px-4 py-2.5 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {perf.hoursByDev.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{r.developer}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{Number(r.hours)}</td>
                  </tr>
                ))}
                {!perf.hoursByDev.length && (
                  <tr><td colSpan="2" className="px-4 py-8 text-center text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODALS */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {{ task: "New Task", bug: "Report Bug", time: "Log Time", deploy: "Log Deployment", milestone: "New Milestone" }[modal]}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {(modal === "task" || modal === "bug") && (
              <>
                <input
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title"
                  className={inputCls}
                />
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className={inputCls}
                />
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.assignee_id || ""}
                    onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Assignee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <select
                    value={form[modal === "task" ? "priority" : "severity"] || "Medium"}
                    onChange={(e) =>
                      setForm({ ...form, [modal === "task" ? "priority" : "severity"]: e.target.value })
                    }
                    className={inputCls}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {modal === "task" && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Due date</label>
                    <input
                      type="date"
                      value={form.due_date || ""}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                )}
              </>
            )}

            {modal === "time" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.work_date || ""}
                    onChange={(e) => setForm({ ...form, work_date: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={form.hours || ""}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="Hours"
                    className={inputCls}
                  />
                </div>
                <select
                  value={form.employee_id || ""}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Developer...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <input
                  value={form.summary || ""}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="What was done?"
                  className={inputCls}
                />
              </>
            )}

            {modal === "deploy" && (
              <>
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.version_tag || ""}
                    onChange={(e) => setForm({ ...form, version_tag: e.target.value })}
                    placeholder="Version (v1.2.0)"
                    className={inputCls}
                  />
                  <select
                    value={form.environment || "Production"}
                    onChange={(e) => setForm({ ...form, environment: e.target.value })}
                    className={inputCls}
                  >
                    {ENVIRONMENTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={form.features || ""}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="Features / changes deployed"
                  rows={2}
                  className={inputCls}
                />
                <select
                  value={form.status || "Success"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputCls}
                >
                  <option>Success</option>
                  <option>Failed</option>
                  <option>Rolled Back</option>
                </select>
              </>
            )}

            {modal === "milestone" && (
              <>
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <input
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Milestone title"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.target_date || ""}
                    onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={form.status || "Planned"}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputCls}
                  >
                    {MS_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <input
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes"
                  className={inputCls}
                />
              </>
            )}

            <button
              onClick={submitModal}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
