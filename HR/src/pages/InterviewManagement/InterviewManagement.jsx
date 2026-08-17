import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  PhoneCall,
  CalendarClock,
  BadgeCheck,
  UserCheck,
  Plus,
} from "lucide-react";
import HrInterviewTable from "../../components/hr/HrInterviewTable";
import AddInterviewModal from "../../components/hr/AddInterviewModal";
import EditInterviewModal from "../../components/hr/EditInterviewModal";
import HRNavbar from "../../components/hr/HRNavbar";

function StatTile({ title, value, subText, icon: Icon, accent, bar }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`absolute inset-x-0 top-0 h-1 ${bar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subText}</p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accent}`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

export default function InterviewManagement() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    scheduled: 0,
    selected: 0,
    joined: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editData, setEditData] = useState(null);
  const [locations, setLocations] = useState([]);

  const token = localStorage.getItem("hrms_hr_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  // ================= FETCH LOCATION
  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/hr/interviews/locations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = res?.data?.data || [];
      setLocations(data);
    } catch (err) {
      console.log("Location fetch error:", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // ================= FETCH DASHBOARD
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${BASE}/hr/interviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res?.data?.data || [];
      setRows(data);

      // calculate stats (HR scoped already from backend)
      const totalCalls = data.length;
      const scheduled = data.filter((r) => r.interview_date).length;
      const selected = data.filter(
        (r) => r.client_status === "accepted",
      ).length;
      const joined = data.filter((r) => r.joined === "Yes").length;

      setStats({
        totalCalls,
        scheduled,
        selected,
        joined,
      });
    } catch (err) {
      toast.error(`HR dashboard error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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

          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                Recruitment
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
                Interview Management
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Track every candidate call, schedule interviews, and follow
                client decisions from one place.
              </p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <Plus size={16} aria-hidden="true" />
              Add Interview
            </button>
          </div>
        </div>

        {/* ── STAT TILES ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            title="Total Calls"
            value={stats.totalCalls}
            subText="All candidates handled"
            icon={PhoneCall}
            accent="bg-sky-50 text-sky-600 ring-sky-100"
            bar="bg-sky-500"
          />
          <StatTile
            title="Scheduled Interview"
            value={stats.scheduled}
            subText="Interviews planned"
            icon={CalendarClock}
            accent="bg-violet-50 text-violet-600 ring-violet-100"
            bar="bg-violet-500"
          />
          <StatTile
            title="Total Selected"
            value={stats.selected}
            subText="Approved by client"
            icon={BadgeCheck}
            accent="bg-emerald-50 text-emerald-600 ring-emerald-100"
            bar="bg-emerald-500"
          />
          <StatTile
            title="Joined"
            value={stats.joined}
            subText="Candidates onboarded"
            icon={UserCheck}
            accent="bg-amber-50 text-amber-600 ring-amber-100"
            bar="bg-amber-500"
          />
        </div>

        {/* ── TABLE ─────────────────────────────────────────── */}
        <HrInterviewTable
          rows={rows}
          loading={loading}
          onEdit={setEditData}
          locations={locations}
        />

        <AddInterviewModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchDashboard}
          locations={locations}
        />

        <EditInterviewModal
          open={!!editData}
          data={editData}
          onClose={() => setEditData(null)}
          onSuccess={fetchDashboard}
          locations={locations}
        />
      </div>
    </div>
  );
}
