import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AddEmployeeModal from "../../components/employees/AddEmployeeModal";
import EditEmployeeModal from "../../components/employees/EditEmployeeModal";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/employeesService";

import {
  getDepartments,
  getDesignations,
  getStatuses,
} from "../../services/masterService";


export default function EmployeeManagement() {
  // ============================
  // STATES
  // ============================
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState(0);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    employeeCode: "",
    name: "",
    email: "",
    phone: "",
    departmentId: 0,
    designationId: 0,
    joiningDate: "",
    salary: "",
    statusId: 1,
    isActive: true,
  });

  // ============================
  // BACKEND DATA
  // ============================

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [empRes, deptRes, desigRes, statusRes] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getDesignations(),
          getStatuses(),
        ]);

        setEmployees(
          (empRes.data?.data ?? []).map((e) => ({
            ...e,
            departmentId: Number(e.departmentId),
            designationId: Number(e.designationId),
            statusId: Number(e.statusId),
            isActive: Number(e.isActive),
          }))
        );
        setDepartments(deptRes.data?.data || []);
        setDesignations(desigRes.data?.data || []);
        setStatuses(statusRes.data?.data || []);
      } catch (err) {
        toast.error("Failed to load data");
      }
    };

    fetchAll();
  }, []);

  // ============================
  // BACKEND DATA
  // ============================

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getEmployees();
        setEmployees(res.data?.data ?? []);
      } catch (err) {
        // toast.error(err?.response?.data?.message || "Failed to fetch employees");
        toast.error("Failed to fetch employees");
      }
    };

    fetchEmployees();
  }, []);


  // ============================
  // MAPS
  // ============================
  const deptById = useMemo(() => {
    const obj = {};
    departments.forEach((d) => (obj[d.id] = d));
    return obj;
  }, [departments]);

  const desigById = useMemo(() => {
    const obj = {};
    designations.forEach((d) => (obj[d.id] = d));
    return obj;
  }, [designations]);

  const statusById = useMemo(() => {
    const obj = {};
    statuses.forEach((s) => (obj[s.id] = s));
    return obj;
  }, [statuses]);

  // ============================
  // OPTIONS
  // ============================
  const departmentOptions = [
    { value: 0, label: "Select Department" },
    ...departments.map((d) => ({ value: d.id, label: `${d.id} - ${d.name}` })),
  ];

  const designationOptions = [
    { value: 0, label: "Select Designation" },
    ...designations.map((d) => ({ value: d.id, label: `${d.id} - ${d.name}` })),
  ];

  const statusOptions = statuses.map((s) => ({
    value: s.id,
    label: `${s.id} - ${s.name}`,
  }));

  const deptFilterOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const statusFilterOptions = [
    { value: 0, label: "All Status" },
    ...statuses.map((s) => ({ value: s.id, label: s.name })),
  ];

// ============================
// FILTERED LIST
// ============================
const filteredEmployees = (employees || []).filter((e) => {
  if (!e) return false; // 🔥 protects against undefined rows

  const q = (search || "").toLowerCase();

  const matchSearch =
    (e.name || "").toLowerCase().includes(q) ||
    (e.email || "").toLowerCase().includes(q) ||
    (e.employeeCode || "").toLowerCase().includes(q) ||
    (e.phone || "").toLowerCase().includes(q);

  const matchDept =
    deptFilter === 0 ? true : Number(e.departmentId) === Number(deptFilter);

  const matchStatus =
    statusFilter === 0 ? true : Number(e.statusId) === Number(statusFilter);

  return matchSearch && matchDept && matchStatus;
});
  // ============================
  // HELPERS
  // ============================
  const resetForm = () => {
    setForm({
      employeeCode: "",
      name: "",
      email: "",
      phone: "",
      departmentId: 0,
      designationId: 0,
      joiningDate: "",
      salary: "",
      statusId: 1,
      isActive: true,
    });
  };

  const openAddModal = () => {
    resetForm();
    setOpenAdd(true);
  };

  // ============================
  // EDIT MODAL
  // ============================
const openEditModal = (emp) => {
  setSelectedEmployee(emp);
  setOpenEdit(true);
};

  // ============================
  // Create
  // ============================
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        employeeCode: form.employeeCode || "",
        name: form.name,
        email: form.email,
        phone: form.phone,
        departmentId: Number(form.departmentId),
        designationId: Number(form.designationId),
        joiningDate: form.joiningDate,
        salary: Number(form.salary || 0),
        statusId: Number(form.statusId || 1),
        isActive: form.isActive ? 1 : 0,
      };

      const res = await createEmployee(payload);

      setEmployees((prev) => [res.data.data, ...prev]);
      toast.success("Employee created ");
      setOpenAdd(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create employee");
    }
  };

  // ============================
  // Update
  // ============================
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const payload = {
        employeeCode: form.employeeCode,
        name: form.name,
        email: form.email,
        phone: form.phone,
        departmentId: Number(form.departmentId),
        designationId: Number(form.designationId),
        joiningDate: form.joiningDate,
        salary: Number(form.salary || 0),
        statusId: Number(form.statusId),
        isActive: form.isActive ? 1 : 0,
      };

      const res = await updateEmployee(selectedEmployee.id, payload);

      setEmployees((prev) =>
        prev.map((x) => (x.id === selectedEmployee.id ? res.data.employee : x))
      );

      toast.success("Employee updated ✅");
      setOpenEdit(false);
      setSelectedEmployee(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update employee");
    }
  };

  // ============================
  // Delete
  // ============================
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((x) => x.id !== id));
      toast.success("Employee deleted ✅");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete employee");
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1">
            Manage employees with department, designation & status.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition"
        >
          + Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, employeeCode..."
          className="w-full xl:w-[420px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
        />

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(Number(e.target.value))}
          className="w-full xl:w-[220px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {deptFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(Number(e.target.value))}
          className="w-full xl:w-[220px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden w-screen sm:max-w-[calc(100vw-288px-40px)]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-900">
            Total Employees: {filteredEmployees.length}
          </p>
        </div>

        {/* ✅ Scroll*/}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin-premium">
          <div className="w-full overflow-auto max-h-[60vh] scrollbar-thin-premium">
            <table className="min-w-[1300px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">EmpCode</th>
                  <th className="text-left px-5 py-4 font-semibold">Name</th>
                  <th className="text-left px-5 py-4 font-semibold">Email</th>
                  <th className="text-left px-5 py-4 font-semibold">Phone</th>
                  <th className="text-left px-5 py-4 font-semibold">Department</th>
                  <th className="text-left px-5 py-4 font-semibold">Designation</th>
                  <th className="text-left px-5 py-4 font-semibold">Joining</th>
                  <th className="text-left px-5 py-4 font-semibold">Salary</th>
                  <th className="text-left px-5 py-4 font-semibold">Status</th>
                  <th className="text-left px-5 py-4 font-semibold">Active</th>
                  <th className="text-right px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((e) => {
                  const deptName = deptById?.[e.departmentId]?.name || "UNKNOWN";
                  const desigName = desigById?.[e.designationId]?.name || "UNKNOWN";
                  const statusName = statusById?.[e.statusId]?.name || "UNKNOWN";

                  return (
                    <tr
                      key={e.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {e.employeeCode}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {e.name}
                      </td>

                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {e.email}
                      </td>


                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {e.phone || "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {e.departmentId} - {deptName}
                      </td>

                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {e.designationId} - {desigName}
                      </td>

                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {e.joiningDate ? String(e.joiningDate).slice(0, 10) : "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        ₹{Number(e.salary || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                          {e.statusId} - {statusName}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${e.isActive === 1
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {e.isActive === 1 ? "YES" : "NO"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(e)}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(e.id)}
                          className="ml-2 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="11" className="px-5 py-10 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* ADD MODAL */}
      {/* ===================== */}
      <AddEmployeeModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        statusOptions={statusOptions}
      />

      {/* ===================== */}
      {/* EDIT MODAL */}
      {/* ===================== */}
      <EditEmployeeModal
        open={openEdit}
        employee={selectedEmployee}  
        onClose={() => {
          setOpenEdit(false);
          setSelectedEmployee(null);
        }}
        form={form}
        setForm={setForm}
        onSubmit={handleUpdate}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        statusOptions={statusOptions}
      />
    </div>
  );
}
