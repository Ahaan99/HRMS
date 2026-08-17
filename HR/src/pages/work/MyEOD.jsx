import { useEffect, useState } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Calendar,
  X,
} from "lucide-react";
import HRNavbar from "../../components/hr/HRNavbar";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700",
    icon: AlertCircle,
  },
  submitted: {
    label: "Submitted",
    color: "bg-sky-100 text-sky-700",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-700",
    icon: XCircle,
  },
};

export default function MyEOD() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    tasksCompleted: "",
    tasksInProgress: "",
    blockers: "",
    tomorrowPlan: "",
    notes: "",
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await API.get("/hr/eod");
      setReports(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const resetForm = () => {
    setForm({
      date: dayjs().format("YYYY-MM-DD"),
      tasksCompleted: "",
      tasksInProgress: "",
      blockers: "",
      tomorrowPlan: "",
      notes: "",
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!form.tasksCompleted) {
        toast.error("Tasks completed required");
        return;
      }

      if (editId) {
        await API.patch(`/hr/eod/${editId}`, form);
        toast.success("EOD updated");
      } else {
        await API.post("/hr/eod", form);
        toast.success("EOD submitted");
      }

      setOpenModal(false);
      resetForm();
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  const handleEdit = (report) => {
    setEditId(report.id);
    setForm({
      date: dayjs(report.date).format("YYYY-MM-DD"),
      tasksCompleted: report.tasksCompleted || "",
      tasksInProgress: report.tasksInProgress || "",
      blockers: report.blockers || "",
      tomorrowPlan: report.tomorrowPlan || "",
      notes: report.notes || "",
    });
    setOpenModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6">
      <HRNavbar />

      <div className="mx-auto mt-6 max-w-[1600px] space-y-6">
        {/* ── HERO BAND ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-9 md:px-12">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                Personal
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
                My EOD Reports
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Submit and manage your daily end-of-day reports.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setOpenModal(true);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors hover:bg-indigo-500"
            >
              <Plus size={16} aria-hidden="true" />
              Submit EOD
            </button>
          </div>
        </div>

        {/* ── CARDS ─────────────────────────────────────────── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">
            Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => {
              const status = STATUS_CONFIG[report.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={report.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  {/* TOP */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        EOD Report
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar size={14} aria-hidden="true" />
                        {dayjs(report.date).format("MMM D, YYYY")}
                      </div>
                    </div>

                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.color}`}
                    >
                      <StatusIcon size={12} aria-hidden="true" />
                      {status.label}
                    </span>
                  </div>

                  {/* TASKS */}
                  <div className="mb-5 space-y-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Tasks Completed
                      </p>
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {report.tasksCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Tomorrow Plan
                      </p>
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {report.tomorrowPlan}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setViewModal(true);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      <Eye size={15} aria-hidden="true" />
                      View
                    </button>

                    {report.status !== "approved" &&
                      report.status !== "rejected" && (
                        <button
                          onClick={() => handleEdit(report)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                        >
                          <Edit size={15} aria-hidden="true" />
                          Edit
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!reports.length && !loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileText size={22} aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-600">
              No EOD reports found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Submit your first end-of-day report to get started.
            </p>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ─────────────────────────────── */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editId ? "Edit EOD" : "Submit EOD"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {[
                ["tasksCompleted", "Tasks Completed"],
                ["tasksInProgress", "Tasks In Progress"],
                ["blockers", "Blockers"],
                ["tomorrowPlan", "Tomorrow Plan"],
                ["notes", "Notes"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {label}
                  </label>
                  <textarea
                    rows={3}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  {editId ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ──────────────────────────────────────── */}
      {viewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="relative overflow-hidden bg-slate-900 px-8 py-7">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/25 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
                      <FileText size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        EOD Report
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-400">
                        Daily work summary and progress report
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm text-slate-200">
                      <Calendar size={14} aria-hidden="true" />
                      {dayjs(selectedReport.date).format("MMMM D, YYYY")}
                    </span>
                    <span
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        STATUS_CONFIG[selectedReport.status]?.color
                      }`}
                    >
                      {STATUS_CONFIG[selectedReport.status]?.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setViewModal(false)}
                  aria-label="Close"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="max-h-[64vh] overflow-y-auto p-7">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Tasks Completed",
                    sub: "Successfully finished work",
                    value: selectedReport.tasksCompleted,
                    fallback: "No completed tasks",
                    icon: CheckCircle,
                    accent: "bg-emerald-50 text-emerald-600 ring-emerald-100",
                  },
                  {
                    title: "In Progress",
                    sub: "Ongoing tasks and activities",
                    value: selectedReport.tasksInProgress,
                    fallback: "No active tasks",
                    icon: Clock,
                    accent: "bg-sky-50 text-sky-600 ring-sky-100",
                  },
                  {
                    title: "Blockers",
                    sub: "Issues or roadblocks faced",
                    value: selectedReport.blockers,
                    fallback: "No blockers reported",
                    icon: AlertCircle,
                    accent: "bg-rose-50 text-rose-600 ring-rose-100",
                  },
                  {
                    title: "Tomorrow Plan",
                    sub: "Planned work for next day",
                    value: selectedReport.tomorrowPlan,
                    fallback: "No plans added",
                    icon: Calendar,
                    accent: "bg-indigo-50 text-indigo-600 ring-indigo-100",
                  },
                ].map((section) => (
                  <div
                    key={section.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${section.accent}`}
                      >
                        <section.icon size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {section.title}
                        </h3>
                        <p className="text-xs text-slate-500">{section.sub}</p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {section.value || section.fallback}
                    </p>
                  </div>
                ))}
              </div>

              {/* NOTES */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                    <Edit size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Additional Notes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Extra comments and observations
                    </p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {selectedReport.notes || "No additional notes"}
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-7 py-4">
              <button
                onClick={() => setViewModal(false)}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
