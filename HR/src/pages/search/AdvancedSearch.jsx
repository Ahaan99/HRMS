import { useEffect, useState, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  Users,
  RotateCcw,
} from "lucide-react";
import API from "../../api/axios";
import HRNavbar from "../../components/hr/HRNavbar";

const EMPTY = {
  q: "", departmentId: "", designationId: "", statusId: "",
  salaryMin: "", salaryMax: "", joinedFrom: "", joinedTo: "", skill: "",
};

const inputCls =
  "text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white";

export default function AdvancedSearch() {
  const [type, setType] = useState("employees");
  const [filters, setFilters] = useState(EMPTY);
  const [options, setOptions] = useState({ departments: [], designations: [], empStatuses: [], candStatuses: [] });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 25;

  useEffect(() => {
    API.get("/search/filters")
      .then((r) => setOptions(r.data))
      .catch(() => {});
  }, []);

  const run = useCallback(async (p = 1, f = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = { type, page: p, pageSize };
      Object.entries(f).forEach(([k, v]) => { if (v !== "") params[k] = v; });
      const r = await API.get("/search/advanced", { params });
      setRows(r.data.data || []);
      setTotal(r.data.total || 0);
      setPage(p);
    } catch (e) {
      setError(e.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, [type, filters]);

  useEffect(() => { run(1); }, [type]); // eslint-disable-line

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const statuses = (type === "employees" ? options.empStatuses : options.candStatuses) || [];
  const pages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <HRNavbar />
      {/* ── HERO BAND ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-8 md:px-10">
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

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Directory
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
              Advanced Search
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Search across employees and candidates with rich filters.
            </p>
          </div>

          <div className="inline-flex overflow-hidden rounded-xl border border-white/15">
            {["employees", "candidates"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  type === t
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTERS ─────────────────────────────────────────── */}
      <form
        onSubmit={(e) => { e.preventDefault(); run(1); }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <SlidersHorizontal size={14} aria-hidden="true" /> Filters
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              size={15}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filters.q} onChange={set("q")}
              placeholder={type === "employees" ? "Name, email, phone, employee code..." : "Name, email, phone, job title, candidate ID..."}
              className={`${inputCls} w-full pl-9 pr-3`}
            />
          </div>
          <select value={filters.statusId} onChange={set("statusId")} className={inputCls}>
            <option value="">Any status</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {type === "employees" && (
            <>
              <select value={filters.departmentId} onChange={set("departmentId")} className={inputCls}>
                <option value="">Any department</option>
                {options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={filters.designationId} onChange={set("designationId")} className={inputCls}>
                <option value="">Any designation</option>
                {options.designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="number" min="0" value={filters.salaryMin} onChange={set("salaryMin")}
                placeholder="Min salary (monthly)" className={inputCls} />
              <input type="number" min="0" value={filters.salaryMax} onChange={set("salaryMax")}
                placeholder="Max salary (monthly)" className={inputCls} />
              <input value={filters.skill} onChange={set("skill")}
                placeholder="Skill (e.g. React, Payroll)" className={inputCls} />
            </>
          )}
          <div className="flex gap-2">
            <input type="date" value={filters.joinedFrom} onChange={set("joinedFrom")}
              className={`${inputCls} flex-1 px-2`} title="Joined from" />
            <input type="date" value={filters.joinedTo} onChange={set("joinedTo")}
              className={`${inputCls} flex-1 px-2`} title="Joined to" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50">
            <Search size={14} aria-hidden="true" /> {loading ? "Searching..." : "Search"}
          </button>
          <button type="button" onClick={() => { setFilters(EMPTY); run(1, EMPTY); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            <RotateCcw size={13} aria-hidden="true" /> Reset
          </button>
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Users size={14} aria-hidden="true" /> {total} result{total === 1 ? "" : "s"}
          </span>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      )}

      {/* ── RESULTS TABLE ───────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[55vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                {type === "employees" ? (
                  <>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Designation</th>
                    <th className="px-4 py-3 font-semibold">Salary</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-semibold">Job Title</th>
                    <th className="px-4 py-3 font-semibold">Applied</th>
                  </>
                )}
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No results match your filters</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-400">{r.employeeCode || r.candidateId || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-600">{r.email}</div>
                    <div className="text-xs text-slate-400">{r.phone || ""}</div>
                  </td>
                  {type === "employees" ? (
                    <>
                      <td className="px-4 py-3 text-slate-600">{r.department || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.designation || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.salary ? `Rs. ${Number(r.salary).toLocaleString("en-IN")}` : "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.joiningDate ? new Date(r.joiningDate).toLocaleDateString("en-IN") : "-"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-600">{r.jobTitle || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {r.status || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1 || loading} onClick={() => run(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40">Previous</button>
              <button disabled={page >= pages || loading} onClick={() => run(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
