import { useEffect, useState, useCallback } from "react";
import { Search, UserSearch, RotateCcw } from "lucide-react";
import API from "../../services/api";

const EMPTY = { q: "", salaryMin: "", salaryMax: "", joinedFrom: "", joinedTo: "" };

export default function EmployeeSearch() {
  const [filters, setFilters] = useState(EMPTY);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 25;

  const run = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize };
      Object.entries(filters).forEach(([k, v]) => { if (v !== "") params[k] = v; });
      const r = await API.get("/client/search/employees", { params });
      setRows(r.data.data || []);
      setTotal(r.data.total || 0);
      setPage(p);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { run(1); }, []); // eslint-disable-line

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const pages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
        <UserSearch size={20} className="text-indigo-600" /> Employee Search
      </h1>

      <form onSubmit={(e) => { e.preventDefault(); run(1); }}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.q} onChange={set("q")}
            placeholder="Name, email, phone, employee code..."
            className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2" />
        </div>
        <input type="number" min="0" value={filters.salaryMin} onChange={set("salaryMin")}
          placeholder="Min salary" className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <input type="number" min="0" value={filters.salaryMax} onChange={set("salaryMax")}
          placeholder="Max salary" className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <div className="flex gap-2 md:col-span-2">
          <input type="date" value={filters.joinedFrom} onChange={set("joinedFrom")}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-2" title="Joined from" />
          <input type="date" value={filters.joinedTo} onChange={set("joinedTo")}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-2" title="Joined to" />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50">
            <Search size={14} /> {loading ? "Searching..." : "Search"}
          </button>
          <button type="button" onClick={() => setFilters(EMPTY)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            <RotateCcw size={13} /> Reset
          </button>
          <span className="ml-auto self-center text-sm text-gray-500">{total} result{total === 1 ? "" : "s"}</span>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="max-h-[55vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Salary</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No employees match your filters</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.employeeCode || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-600">{r.email}</div>
                    <div className="text-xs text-gray-400">{r.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.department || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.designation || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.salary ? `Rs. ${Number(r.salary).toLocaleString("en-IN")}` : "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.joiningDate ? new Date(r.joiningDate).toLocaleDateString("en-IN") : "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {r.status || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1 || loading} onClick={() => run(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button disabled={page >= pages || loading} onClick={() => run(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
