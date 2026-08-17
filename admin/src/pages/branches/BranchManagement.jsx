import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { Building2, Plus, Users, MapPin } from "lucide-react";

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [branchEmps, setBranchEmps] = useState([]);
  const [assign, setAssign] = useState({ employee_id: "", branch_id: "" });
  const [form, setForm] = useState({
    name: "",
    code: "",
    city: "",
    address: "",
    manager_employee_id: "",
  });

  const load = useCallback(async () => {
    try {
      const [b, u] = await Promise.all([
        API.get("/branches"),
        API.get("/branches/unassigned"),
      ]);
      setBranches(b.data.data);
      setUnassigned(u.data.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load branches");
    }
  }, []);

  useEffect(() => {
    load();
    API.get("/employees?limit=500")
      .then(({ data }) => setEmployees(data.data || data.employees || []))
      .catch(() => {});
  }, [load]);

  const createBranch = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim())
      return toast.error("Branch name and code are required");
    try {
      await API.post("/branches", {
        ...form,
        manager_employee_id: form.manager_employee_id || null,
      });
      toast.success("Branch created");
      setShowForm(false);
      setForm({ name: "", code: "", city: "", address: "", manager_employee_id: "" });
      load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Create failed");
    }
  };

  const assignEmp = async (e) => {
    e.preventDefault();
    if (!assign.employee_id || !assign.branch_id)
      return toast.error("Select employee and branch");
    try {
      await API.post("/branches/assign", assign);
      toast.success("Employee assigned");
      setAssign({ employee_id: "", branch_id: "" });
      load();
      if (selected) viewBranch(selected);
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Assign failed");
    }
  };

  const viewBranch = async (b) => {
    setSelected(b);
    try {
      const { data } = await API.get(`/branches/${b.id}/employees`);
      setBranchEmps(data.data);
    } catch {
      setBranchEmps([]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={26} />
            Multi-Branch Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Branches, managers and employee assignments
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          <Plus size={16} /> New branch
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createBranch}
          className="bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Branch name *" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Code * e.g. BLR01" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="City" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Address" className="md:col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <select value={form.manager_employee_id}
            onChange={(e) => setForm((f) => ({ ...f, manager_employee_id: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="">Branch manager (optional)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <div className="md:col-span-3">
            <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              Create branch
            </button>
          </div>
        </form>
      )}

      {/* Assign employee */}
      <form
        onSubmit={assignEmp}
        className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-wrap items-center gap-3"
      >
        <span className="text-sm font-semibold text-gray-700">Assign employee:</span>
        <select
          value={assign.employee_id}
          onChange={(e) => setAssign((a) => ({ ...a, employee_id: e.target.value }))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm min-w-[180px]"
        >
          <option value="">Select employee</option>
          {(unassigned.length ? unassigned : employees).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
            </option>
          ))}
        </select>
        <select
          value={assign.branch_id}
          onChange={(e) => setAssign((a) => ({ ...a, branch_id: e.target.value }))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">Select branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold">
          Assign
        </button>
        {unassigned.length > 0 && (
          <span className="text-xs text-amber-600 ml-auto">
            {unassigned.length} employees not assigned to any branch
          </span>
        )}
      </form>

      {/* Branch cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div
            key={b.id}
            className={`bg-white rounded-2xl border p-5 cursor-pointer transition ${
              selected?.id === b.id
                ? "border-indigo-400 ring-2 ring-indigo-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => viewBranch(b)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{b.name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{b.code}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  b.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {b.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {b.city && (
              <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                <MapPin size={13} /> {b.city}
              </p>
            )}
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="flex items-center gap-1 text-gray-500">
                <Users size={14} /> {b.headcount} employees
              </span>
              <span className="text-xs text-gray-400">
                {b.manager_name ? `Mgr: ${b.manager_name}` : "No manager"}
              </span>
            </div>
          </div>
        ))}
        {!branches.length && (
          <p className="text-gray-400 text-sm col-span-full py-8 text-center">
            No branches yet — create your first branch above
          </p>
        )}
      </div>

      {/* Branch employee list */}
      {selected && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Employees at {selected.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {branchEmps.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{emp.name}</td>
                    <td className="py-2 pr-4 text-gray-500">{emp.employeeCode || "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{emp.department || "—"}</td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(emp.assigned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!branchEmps.length && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No employees assigned to this branch
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
