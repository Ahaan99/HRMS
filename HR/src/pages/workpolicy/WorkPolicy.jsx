import API from "../../api/axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import HRNavbar from "../../components/hr/HRNavbar";
import PolicyFilters from "../../components/workpolicy/PolicyFilters";
import PolicyTable from "../../components/workpolicy/PolicyTable";
import AddPolicyModal from "../../components/workpolicy/AddPolicyModal";
import {
  ScrollText,
  FilePen,
  SearchCheck,
  Archive,
  Plus,
} from "lucide-react";

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

export default function WorkPolicy() {
  const [stats, setStats] = useState({
    active: 0,
    draft: 0,
    underReview: 0,
    archived: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    department: "",
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);

      const res = await API.get(`/hr/work-policies?${params}`);

      const data = res?.data?.data || [];
      setRows(data);
      calculateStats(data);
    } catch (err) {
      toast.error(`Work policies fetch error: ${err}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const active = data.filter((r) => r.status === "active").length;
    const draft = data.filter((r) => r.status === "draft").length;
    const underReview = data.filter((r) => r.status === "under_review").length;
    const archived = data.filter((r) => r.status === "archived").length;

    setStats({ active, draft, underReview, archived });
  };

  useEffect(() => {
    fetchPolicies();
  }, [filters]);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/hr/work-policies/${id}`);
      toast.success("Policy deleted");
      fetchPolicies(); // refresh table
    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error("Delete failed");
    }
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
                Governance
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
                Work Policy Sheet
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Company work guidelines &amp; policies — drafts, reviews, and
                everything currently in effect.
              </p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors hover:bg-indigo-500"
            >
              <Plus size={16} aria-hidden="true" />
              Add New Policy
            </button>
          </div>
        </div>

        {/* ── STAT TILES ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            title="Active Policies"
            value={stats.active}
            subText="Currently in effect"
            icon={ScrollText}
            accent="bg-emerald-50 text-emerald-600 ring-emerald-100"
            bar="bg-emerald-500"
          />
          <StatTile
            title="Draft"
            value={stats.draft}
            subText="Under preparation"
            icon={FilePen}
            accent="bg-slate-50 text-slate-600 ring-slate-200"
            bar="bg-slate-400"
          />
          <StatTile
            title="Under Review"
            value={stats.underReview}
            subText="Pending approval"
            icon={SearchCheck}
            accent="bg-amber-50 text-amber-600 ring-amber-100"
            bar="bg-amber-500"
          />
          <StatTile
            title="Archived"
            value={stats.archived}
            subText="Previous versions"
            icon={Archive}
            accent="bg-rose-50 text-rose-600 ring-rose-100"
            bar="bg-rose-500"
          />
        </div>

        <PolicyFilters filters={filters} onFilterChange={setFilters} />

        <PolicyTable
          rows={rows}
          loading={loading}
          onRefresh={fetchPolicies}
          onDelete={handleDelete}
        />

        <AddPolicyModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchPolicies}
        />
      </div>
    </div>
  );
}
