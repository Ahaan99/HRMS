import { useEffect, useState } from "react";
import API from "../../services/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useClientAuth } from "../../context/ClientAuthContext";

export default function LeadAssigner() {
  const [file, setFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  const { client } = useClientAuth();
  const isEmployee = client?.role === "CLIENT_EMPLOYEE";

  const navigate = useNavigate();

  // ✅ FETCH BATCHES (COMMON)
  const fetchBatches = async () => {
    try {
      const res = await API.get("/client/leads/batches");
      setBatches(res.data.data || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch batches");
    }
  };

  // ✅ FETCH DEPARTMENTS (ONLY ADMIN)
  const fetchDepartments = async () => {
    try {
      const res = await API.get("/client/masters/departments");
      setDepartments(res.data.data || []);
    } catch (err) {
      console.log(err);
      // ❌ DON'T SHOW ERROR FOR EMPLOYEE
    }
  };

  // ✅ FETCH EMPLOYEES (ONLY ADMIN)
  const fetchEmployees = async (deptId = "") => {
    try {
      let url = "/client/employees";

      if (deptId) {
        url = `/client/employees/by-department?departmentId=${deptId}`;
      }

      const res = await API.get(url);
      setEmployees(res.data.data || res.data.employees || []);
    } catch (err) {
      console.log(err);
      // ❌ DON'T SHOW ERROR FOR EMPLOYEE
    }
  };

  // 🔥 INITIAL LOAD
  useEffect(() => {
    fetchBatches();

    // ✅ ONLY ADMIN
    if (!isEmployee) {
      fetchDepartments();
      fetchEmployees();
    }
  }, []);

  // 🔥 DEPARTMENT CHANGE (ADMIN ONLY)
  useEffect(() => {
    if (!isEmployee) {
      fetchEmployees(selectedDept);
    }
  }, [selectedDept]);

  // 🔥 UPLOAD (ADMIN ONLY)
  const handleUpload = async () => {
    if (!file || !selectedEmployee) {
      return toast.error("Select file & employee");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignedTo", selectedEmployee);

    try {
      await API.post("/client/leads/upload", formData);

      toast.success("Leads uploaded & assigned");

      setFile(null);
      setSelectedEmployee("");
      fetchBatches();
    } catch (err) {
      console.log(err);
      toast.error("Upload failed");
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* 🔥 ADMIN ONLY UPLOAD UI */}
      {!isEmployee && (
        <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-3 items-center">

          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-2 rounded"
          />

          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setSelectedEmployee("");
            }}
            className="border p-2 rounded"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="border p-2 rounded min-w-[250px]"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeCode} - {emp.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleUpload}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Upload & Assign
          </button>
        </div>
      )}

      {/* 🔥 TITLE FOR EMPLOYEE */}
      {isEmployee && (
        <h2 className="text-xl font-semibold text-gray-700">
          My Assigned Leads
        </h2>
      )}

      {/* 🔥 BATCH CARDS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {batches.map((b) => {
          const progress = b.total
            ? Math.round((b.completed / b.total) * 100)
            : 0;

          return (
            <div
              key={b.id}
              onClick={() => navigate(`/leads/${b.id}`)}
              className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:scale-105 transition cursor-pointer"
            >
              <h2 className="font-bold text-lg">{b.file_name}</h2>

              {!isEmployee && (
                <p className="text-sm mt-2">
                  👤 {b.employee_name || "Not Assigned"}
                </p>
              )}

              <p className="text-sm">
                📅 {new Date(b.created_at).toDateString()}
              </p>

              <div className="mt-4">
                <div className="h-2 bg-white/30 rounded">
                  <div
                    className="h-2 bg-white rounded"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs mt-2">
                  {b.completed} / {b.total} done
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!batches.length && (
        <p className="text-gray-400 text-center">
          No leads available
        </p>
      )}
    </div>
  );
}