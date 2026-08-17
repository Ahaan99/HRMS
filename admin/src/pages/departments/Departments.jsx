import { useEffect, useState } from "react";
import ExportButton from "../../components/common/ExportButton";
import axios from "axios";
import StatCard from "../../components/common/StatCard";
import { Building2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Departments() {
  const token = localStorage.getItem("hrms_admin_token");

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [designationForm, setDesignationForm] = useState({
    name: "",
  });

  // =====================================
  // FETCH DESIGNATION
  // =====================================

  const fetchDesignations = async (deptId) => {
    try {
      const res = await axios.get(`${BASE_URL}/super-admin/designations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = res.data.designations.filter(
        (d) => d.departmentId === deptId,
      );

      setDesignations(filtered);
    } catch (err) {
      console.error("Designation fetch error:", err);
    }
  };

  const [form, setForm] = useState({
    name: "",
  });

  // =====================================
  // FETCH DEPARTMENTS
  // =====================================
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/super-admin/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error("Departments fetch error:", err);
    }
  };

  const handleCreateDesignation = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${BASE_URL}/super-admin/designations`,
        {
          name: designationForm.name,
          departmentId: selectedDept.id, // 🔥 IMPORTANT
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setShowDesignationModal(false);
      setDesignationForm({ name: "" });

      fetchDesignations(selectedDept.id);
    } catch (err) {
      console.error("Create designation error:", err);
    }
  };

  // =====================================
  // FETCH EMPLOYEES BY DEPARTMENT
  // =====================================
  const fetchDepartmentEmployees = async (deptId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/super-admin/departments/${deptId}/employees`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      console.error("Department employees fetch error:", err);
    }
  };

  // =====================================
  // CREATE DEPARTMENT
  // =====================================
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${BASE_URL}/super-admin/departments`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowModal(false);
      setForm({ name: "" });

      fetchDepartments();
    } catch (err) {
      console.error("Create department error:", err);
    }
  };

  // =====================================
  // DELETE DEPARTMENT
  // =====================================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await axios.delete(`${BASE_URL}/super-admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDepartments();
      setSelectedDept(null);
      setEmployees([]);
    } catch (err) {
      console.error("Delete department error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-gray-500">Manage departments and employees</p>
        </div>

        <ExportButton data={departments} filename="departments" />

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2 bg-black text-white rounded-xl font-semibold"
        >
          + Add Department
        </button>
      </div>

      {/* DEPARTMENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            onClick={() => {
              setSelectedDept(dept);
              fetchDepartmentEmployees(dept.id);
              fetchDesignations(dept.id);
            }}
            className="cursor-pointer"
          >
            <StatCard
              title={dept.name}
              value={dept.totalEmployees || 0}
              subText={`Active: ${dept.activeEmployees || 0}`}
              icon={<Building2 />}
              gradient="bg-gradient-to-r from-indigo-400 to-indigo-600"
            />
          </div>
        ))}
      </div>

      {/* RESET BUTTON */}
      {selectedDept && (
        <div>
          <button
            onClick={() => {
              setSelectedDept(null);
              setEmployees([]);
              fetchDepartments();
            }}
            className="px-4 py-2 bg-gray-200 rounded-xl font-semibold"
          >
            Reset / Show All Departments
          </button>
        </div>
      )}

      {/* EMPLOYEE TABLE */}
      {selectedDept && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <p className="font-semibold">Employees in {selectedDept.name}</p>

            <button
              onClick={() => handleDelete(selectedDept.id)}
              className="text-red-600 font-semibold"
            >
              Delete Department
            </button>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left">Code</th>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Email</th>
                  <th className="px-5 py-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-4">{emp.employeeCode}</td>
                    <td className="px-5 py-4">{emp.name}</td>
                    <td className="px-5 py-4">{emp.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          emp.isActive === 1 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {emp.isActive === 1 ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}

                {employees.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DESIGNATIONS */}
      {selectedDept && (
        <div className="bg-white rounded-2xl shadow border mt-6 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              Designations in {selectedDept.name}
            </h3>

            <button
              onClick={() => setShowDesignationModal(true)}
              className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-sm"
            >
              + Add Designation
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {designations.map((d) => (
              <span
                key={d.id}
                className="px-3 py-1 rounded-full bg-gray-100 text-sm"
              >
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SHOW DESIGNATION */}

      {showDesignationModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
      <h3 className="font-semibold mb-4">
        Add Designation For ({selectedDept.name})
      </h3>

      <form onSubmit={handleCreateDesignation} className="space-y-4">
        <input
          required
          placeholder="Designation Name"
          value={designationForm.name}
          onChange={(e) =>
            setDesignationForm({ name: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowDesignationModal(false)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Department</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <input
                required
                placeholder="Department Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-xl"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
