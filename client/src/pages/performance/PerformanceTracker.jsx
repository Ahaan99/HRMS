import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AddPerformanceModal from "../../components/performance/AddPerformanceModal";
import EditPerformanceModal from "../../components/performance/EditPerformanceModal";

import {
  getPerformances,
  createPerformance,
  updatePerformance,
  deletePerformance,
} from "../../services/performanceService";

import { getEmployees } from "../../services/employeesService";
import { getDepartments, getDesignations } from "../../services/masterService";

import { useClientAuth } from "../../context/ClientAuthContext";

export default function PerformanceTracker() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [performances, setPerformances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [performanceFilter, setPerformanceFilter] = useState("all");

  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const { client } = useClientAuth();

  const isEmployee = client?.role === "CLIENT_EMPLOYEE";

  const [form, setForm] = useState({
    employeeId: 0,
    rating: 3,
    review: "",
    reviewDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ✅ always fetch performance
        const perfRes = await getPerformances();
        setPerformances(perfRes.data?.data ?? []);
      } catch (err) {
        toast.error("Failed to load performance");
      }

      try {
        const empRes = await getEmployees();
        setEmployees(
          (empRes.data?.data ?? []).map((e) => ({
            ...e,
            departmentId: Number(e.departmentId),
            designationId: Number(e.designationId),
          })),
        );
      } catch (err) {
        console.warn("Employees not allowed for this role");
      }

      try {
        const deptRes = await getDepartments();
        setDepartments(deptRes.data?.data || []);
      } catch (err) {
        console.warn("Departments not allowed");
      }

      try {
        const desigRes = await getDesignations();
        setDesignations(desigRes.data?.data || []);
      } catch (err) {
        console.warn("Designations not allowed");
      }
    };

    fetchAll();
  }, []);

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

  const empById = useMemo(() => {
    const obj = {};
    employees.forEach((e) => (obj[e.id] = e));
    return obj;
  }, [employees]);

  const employeeOptions = [
    { value: 0, label: "Select Employee" },
    ...employees.map((e) => ({
      value: e.id,
      label: `${e.employeeCode} - ${e.name}`,
    })),
  ];

  const deptFilterOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const performanceFilterOptions = [
    { value: "all", label: "All Performance" },
    { value: "excellent", label: "Excellent (4-5)" },
    { value: "good", label: "Good (3)" },
    { value: "poor", label: "Poor (1-2)" },
  ];

  const filteredPerformances = (performances || []).filter((p) => {
    if (!p) return false;

    const q = (search || "").toLowerCase();
    const emp = empById[p.employeeId] || {};
    const deptName = deptById[emp.departmentId]?.name || "";

    const matchSearch =
      (emp.name || "").toLowerCase().includes(q) ||
      (emp.email || "").toLowerCase().includes(q) ||
      (emp.employeeCode || "").toLowerCase().includes(q) ||
      (p.review || "").toLowerCase().includes(q);

    const matchDept =
      deptFilter === 0 ? true : Number(emp.departmentId) === Number(deptFilter);

    const rating = Number(p.score || 0);
    let matchPerf = true;
    if (performanceFilter === "excellent") matchPerf = rating >= 4;
    else if (performanceFilter === "good") matchPerf = rating === 3;
    else if (performanceFilter === "poor") matchPerf = rating <= 2;

    return matchSearch && matchDept && matchPerf;
  });

  const resetForm = () => {
    setForm({
      employeeId: 0,
      rating: 3,
      review: "",
      reviewDate: new Date().toISOString().split("T")[0],
    });
  };

  const openAddModal = () => {
    resetForm();
    setOpenAdd(true);
  };

  const openEditModal = (perf) => {
    setSelectedPerformance(perf);
    setForm({
      employeeId: perf.employeeId,
      rating: Number(perf.score),
      review: perf.review || "",
      reviewDate: perf.reviewDate ? String(perf.reviewDate).slice(0, 10) : "",
    });
    setOpenEdit(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        employeeId: Number(form.employeeId),
        rating: Number(form.rating),
        review: form.review,
        reviewDate: form.reviewDate,
      };

      const res = await createPerformance(payload);
      setPerformances((prev) => [res.data.data, ...prev]);
      toast.success("Performance record added");
      setOpenAdd(false);
    } catch (err) {
      // toast.error(err?.response?.data?.message || "Failed to add performance");
      toast.error("Failed to add performance");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPerformance) return;

    try {
      const payload = {
        employeeId: Number(form.employeeId),
        rating: Number(form.rating),
        review: form.review,
        reviewDate: form.reviewDate,
      };

      const res = await updatePerformance(selectedPerformance.id, payload);
      setPerformances((prev) =>
        prev.map((x) =>
          x.id === selectedPerformance.id ? res.data.performance : x,
        ),
      );
      toast.success("Performance updated");
      setOpenEdit(false);
      setSelectedPerformance(null);
    } catch (err) {
      toast.error(
        // err?.response?.data?.message || "Failed to update performance",
        "Failed to update performance",
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this performance record?"))
      return;

    try {
      await deletePerformance(id);
      setPerformances((prev) => prev.filter((x) => x.id !== id));
      toast.success("Performance record deleted");
    } catch (err) {
      toast.error(
        // err?.response?.data?.message || "Failed to delete performance",
        "Failed to delete performance",
      );
    }
  };

  const getPerformanceBadge = (rating) => {
    const r = Number(rating || 0);
    if (r >= 4) {
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
        label: "Excellent",
      };
    } else if (r === 3) {
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
        label: "Good",
      };
    } else {
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
        label: "Poor",
      };
    }
  };

  const getPerformanceDots = (rating) => {
    const r = Number(rating || 0);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-2.5 h-2.5 rounded-full ${
              star <= r
                ? "bg-green-500"
                : star - 0.5 <= r
                  ? "bg-yellow-400"
                  : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const statCounts = useMemo(() => {
    const safeData = (performances || []).filter(
      (p) => p && typeof p === "object",
    );

    const excellent = safeData.filter((p) => Number(p.score || 0) >= 4).length;
    const good = safeData.filter((p) => Number(p.score || 0) === 3).length;
    const poor = safeData.filter((p) => Number(p.score || 0) <= 2).length;

    return {
      excellent,
      good,
      poor,
      total: safeData.length,
    };
  }, [performances]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Performance
          </h1>
          <p className="text-gray-500 mt-1">
            Track and manage employee performance with ratings.
          </p>
        </div>

        {!isEmployee && (
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition"
          >
            + Add Performance
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
          <p className="text-sm text-gray-500 font-medium">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {statCounts.total}
          </p>
        </div>
        <div className="bg-green-50 rounded-2xl shadow border border-green-200 p-4">
          <p className="text-sm text-green-600 font-medium">Excellent (4-5)</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {statCounts.excellent}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-2xl shadow border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600 font-medium">Good (3)</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {statCounts.good}
          </p>
        </div>
        <div className="bg-red-50 rounded-2xl shadow border border-red-200 p-4">
          <p className="text-sm text-red-600 font-medium">Poor (1-2)</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {statCounts.poor}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee name, code, or review..."
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
          value={performanceFilter}
          onChange={(e) => setPerformanceFilter(e.target.value)}
          className="w-full xl:w-[220px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {performanceFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-900">
            Total Records: {filteredPerformances.length}
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="w-full overflow-auto max-h-[60vh]">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 sticky top-0 z-10">
                <tr>
                  {!isEmployee && (
                    <>
                      <th className="text-left px-5 py-4 font-semibold">
                        Emp Code
                      </th>
                      <th className="text-left px-5 py-4 font-semibold">
                        Employee
                      </th>
                      <th className="text-left px-5 py-4 font-semibold">
                        Department
                      </th>
                      <th className="text-left px-5 py-4 font-semibold">
                        Designation
                      </th>
                    </>
                  )}
                  <th className="text-left px-5 py-4 font-semibold">Rating</th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Performance
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">Review</th>
                  <th className="text-left px-5 py-4 font-semibold">Date</th>
                  {!isEmployee && (
                      <th className="text-right px-5 py-4 font-semibold">
                        Action
                      </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredPerformances.map((p) => {
                  const emp = empById[p.employeeId] || {};
                  const deptName =
                    deptById[emp.departmentId]?.name || "UNKNOWN";
                  const desigName =
                    desigById[emp.designationId]?.name || "UNKNOWN";
                  const badge = getPerformanceBadge(p.score);

                  return (
                    <tr
                      key={p.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      {!isEmployee && (
                        <>
                          <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                            {emp.employeeCode || "-"}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {emp.name || "UNKNOWN"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {emp.email || "-"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                            {deptName}
                          </td>

                          <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                            {desigName}
                          </td>
                        </>
                      )}

                      <td className="px-5 py-4 whitespace-nowrap">
                        {getPerformanceDots(p.score)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-700 max-w-[250px]">
                        <p className="truncate" title={p.review}>
                          {p.review || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {console.log(p)  }
                        {p.reviewDate ? String(p.reviewDate).slice(0, 10) : "-"}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {!isEmployee && (
                          <>
                            <button
                              onClick={() => openEditModal(p)}
                              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="ml-2 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredPerformances.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      No performance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddPerformanceModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        employeeOptions={employeeOptions}
      />

      <EditPerformanceModal
        open={openEdit}
        performance={selectedPerformance}
        onClose={() => {
          setOpenEdit(false);
          setSelectedPerformance(null);
        }}
        form={form}
        setForm={setForm}
        onSubmit={handleUpdate}
        employeeOptions={employeeOptions}
      />
    </div>
  );
}
