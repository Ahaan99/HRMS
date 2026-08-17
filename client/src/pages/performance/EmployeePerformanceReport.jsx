import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  getEmployees,
} from "../../services/employeesService";

import {
  getPerformances,
} from "../../services/performanceService";

import {
  getDepartments,
  getDesignations,
} from "../../services/masterService";

export default function EmployeePerformanceReport() {
  const [employees, setEmployees] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [empRes, perfRes, deptRes, desigRes] = await Promise.all([
          getEmployees(),
          getPerformances(),
          getDepartments(),
          getDesignations(),
        ]);

        setEmployees((empRes.data?.data ?? []).map((e) => ({
          ...e,
          departmentId: Number(e.departmentId),
          designationId: Number(e.designationId),
        })));
        setPerformances(perfRes.data?.data ?? []);
        setDepartments(deptRes.data?.data || []);
        setDesignations(desigRes.data?.data || []);
      } catch (err) {
        toast.error("Failed to load data");
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

  const getEmployeeLatestPerformance = (employeeId) => {
    const empPerformances = performances.filter(
      (p) => Number(p.employeeId) === Number(employeeId)
    );
    if (empPerformances.length === 0) return null;
    const sorted = [...empPerformances].sort((a, b) => {
  const dateA = new Date(`${a.month} 1, ${a.year}`);
  const dateB = new Date(`${b.month} 1, ${b.year}`);
  return dateB - dateA;
});
    return sorted[0];
  };

  const getPerformanceColor = (rating) => {
    const r = Number(rating || 0);
    if (r >= 4) return "green";
    if (r === 3) return "yellow";
    if (r >= 1) return "red";
    return "none";
  };

  const getPerformanceConfig = (rating) => {
    const r = Number(rating || 0);
    if (r >= 4) {
      return {
        color: "green",
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
        bgDark: "bg-green-500",
        label: "Excellent",
        icon: "✓",
      };
    } else if (r === 3) {
      return {
        color: "yellow",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
        bgDark: "bg-yellow-500",
        label: "Good",
        icon: "◆",
      };
    } else if (r >= 1) {
      return {
        color: "red",
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
        bgDark: "bg-red-500",
        label: "Poor",
        icon: "✗",
      };
    }
    return {
      color: "none",
      bg: "bg-gray-100",
      text: "text-gray-500",
      border: "border-gray-300",
      bgDark: "bg-gray-400",
      label: "No Rating",
      icon: "-",
    };
  };

  const filteredEmployees = (employees || []).filter((e) => {
    if (!e) return false;
    const q = (search || "").toLowerCase();
    const matchSearch =
      (e.name || "").toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q) ||
      (e.employeeCode || "").toLowerCase().includes(q);
    const matchDept =
      deptFilter === 0 ? true : Number(e.departmentId) === Number(deptFilter);
    const perf = getEmployeeLatestPerformance(e.id);
    const rating = perf ? Number(perf.score) : 0;
    let matchRating = true;
    if (ratingFilter === "excellent") matchRating = rating >= 4;
    else if (ratingFilter === "good") matchRating = rating === 3;
    else if (ratingFilter === "poor") matchRating = rating >= 1 && rating <= 2;
    else if (ratingFilter === "none") matchRating = !perf;
    return matchSearch && matchDept && matchRating;
  });

  const statCounts = useMemo(() => {
    let excellent = 0, good = 0, poor = 0, noRating = 0;
    employees.forEach((e) => {
      const perf = getEmployeeLatestPerformance(e.id);
      if (!perf) { noRating++; }
      else {
        const r = Number(perf.score);
        if (r >= 4) excellent++;
        else if (r === 3) good++;
        else if (r >= 1) poor++;
        else noRating++;
      }
    });
    return { excellent, good, poor, noRating, total: employees.length };
  }, [employees, performances]);

  const deptFilterOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const ratingFilterOptions = [
    { value: "all", label: "All Ratings" },
    { value: "excellent", label: "Excellent (4-5)" },
    { value: "good", label: "Good (3)" },
    { value: "poor", label: "Poor (1-2)" },
    { value: "none", label: "No Rating" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees Performance Sheet</h1>
          <p className="text-gray-500 mt-1">
            Track employee performance with green, yellow, and red indicators.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
          <p className="text-sm text-gray-500 font-medium">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statCounts.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow border border-green-300 p-4">
          <p className="text-sm text-green-100 font-medium flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full"></span>
            Excellent (4-5)
          </p>
          <p className="text-3xl font-bold text-white mt-1">{statCounts.excellent}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow border border-yellow-300 p-4">
          <p className="text-sm text-yellow-100 font-medium flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full"></span>
            Good (3)
          </p>
          <p className="text-3xl font-bold text-white mt-1">{statCounts.good}</p>
        </div>
        <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl shadow border border-red-300 p-4">
          <p className="text-sm text-red-100 font-medium flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full"></span>
            Poor (1-2)
          </p>
          <p className="text-3xl font-bold text-white mt-1">{statCounts.poor}</p>
        </div>
        <div className="bg-gray-100 rounded-2xl shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">No Rating</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{statCounts.noRating}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or employee code..."
          className="w-full xl:w-[420px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(Number(e.target.value))}
          className="w-full xl:w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {deptFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="w-full xl:w-[180px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {ratingFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-900">
            Total Records: {filteredEmployees.length}
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="w-full overflow-auto max-h-[60vh]">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">Emp Code</th>
                  <th className="text-left px-5 py-4 font-semibold">Employee</th>
                  <th className="text-left px-5 py-4 font-semibold">Department</th>
                  <th className="text-center px-5 py-4 font-semibold">Rating</th>
                  <th className="text-center px-5 py-4 font-semibold">Performance Status</th>
                  <th className="text-left px-5 py-4 font-semibold">Review</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e) => {
                  const deptName = deptById[e.departmentId]?.name || "-";
                  const perf = getEmployeeLatestPerformance(e.id);
                  const config = getPerformanceConfig(perf?.score);
                  const colorCode = getPerformanceColor(perf?.score);

                  return (
                    <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {e.employeeCode || "-"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{e.name || "-"}</p>
                          <p className="text-xs text-gray-500">{e.email || "-"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{deptName}</td>
                      <td className="px-5 py-4 text-center">
                        {perf ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              colorCode === "green" ? "bg-green-500" : colorCode === "yellow" ? "bg-yellow-500" : colorCode === "red" ? "bg-red-500" : "bg-gray-400"
                            }`}>
                              {perf.score}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border-2 ${
                          colorCode === "green" ? "bg-green-100 text-green-700 border-green-300" :
                          colorCode === "yellow" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                          colorCode === "red" ? "bg-red-100 text-red-700 border-red-300" :
                          "bg-gray-100 text-gray-500 border-gray-300"
                        }`}>
                          <span className={`w-4 h-4 rounded-full ${
                            colorCode === "green" ? "bg-green-500" :
                            colorCode === "yellow" ? "bg-yellow-500" :
                            colorCode === "red" ? "bg-red-500" :
                            "bg-gray-400"
                          }`}></span>
                          {config.label}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 max-w-[300px]">
                        <p className="truncate text-sm" title={perf?.review}>
                          {perf?.review || "-"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-xl border-2 border-green-300">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">4-5</div>
            <div>
              <p className="font-bold text-green-700">Excellent</p>
              <p className="text-xs text-green-600">Outstanding performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl border-2 border-yellow-300">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">3</div>
            <div>
              <p className="font-bold text-yellow-700">Good</p>
              <p className="text-xs text-yellow-600">Meets expectations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-100 to-red-50 rounded-xl border-2 border-red-300">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">1-2</div>
            <div>
              <p className="font-bold text-red-700">Poor</p>
              <p className="text-xs text-red-600">Needs improvement</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl border-2 border-gray-300">
            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">-</div>
            <div>
              <p className="font-bold text-gray-700">No Rating</p>
              <p className="text-xs text-gray-500">Not reviewed yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
