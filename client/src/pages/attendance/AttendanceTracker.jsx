import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/common/PageHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";

import AddAttendanceModal from "../../components/attendance/AddAttendanceModal";
import EditAttendanceModal from "../../components/attendance/EditAttendanceModal";

import {
  getAttendanceList,
  deleteAttendance,
} from "../../services/clientAttendanceService";

// =========================
// STATUS OPTIONS
// =========================
const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "LEAVE", label: "Leave" },
];

export default function AttendanceTracker() {
  // =========================
  // STATE
  // =========================
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // =========================
  // FETCH
  // =========================
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await getAttendanceList();
      setRows(res.data?.data || []);
    } catch (err) {
      toast.error(`Failed to load attendance `);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // =========================
  // FILTER
  // =========================
  const filteredRows = useMemo(() => {
    const q = (search || "").toLowerCase();

    return (rows || []).filter((r) => {
      if (!r) return false;

      const matchSearch =
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeCode || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ? true : r.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  // =========================
  // ACTIONS
  // =========================
  const handleEdit = (row) => {
    setSelectedRow(row);
    setOpenEdit(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAttendance(deleteId);
      toast.success("Deleted successfully");
      setOpenDelete(false);
      fetchAttendance();
    } catch {
      toast.error("Delete failed");
    }
  };


// ===== helpers =====
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dt) => {
  if (!dt) return "-";
  return new Date(dt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusStyle = (status) => {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-700";
    case "ABSENT":
      return "bg-red-100 text-red-700";
    case "HALF_DAY":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

  // =========================
  // UI
  // =========================
  return (
  <div className="space-y-6">

    {/* HEADER */}
    <div className="flex justify-between items-center">
      <PageHeader
        title="Attendance Tracker"
        desc="Track daily attendance and employee presence"
      />

      <button
        onClick={() => setOpenAdd(true)}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow hover:scale-105 transition"
      >
        + Add Attendance
      </button>
    </div>

    {/* FILTER BAR */}
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 flex flex-wrap gap-3 items-center">

      <input
        placeholder="🔍 Search employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-xl px-4 py-2 text-sm w-60 focus:ring-2 focus:ring-indigo-500 outline-none"
      />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        <option value="ALL">All Status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="ml-auto text-sm text-gray-500">
        Total: {filteredRows.length}
      </div>
    </div>

    {/* TABLE */}
    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

      <div className="overflow-auto max-h-[60vh] w-screen sm:max-w-[calc(100vw-288px-40px)]">
        <table className="min-w-[900px] w-full text-sm">

          {/* HEADER */}
          <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Employee</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Check In</th>
              <th className="px-4 py-3 text-left font-semibold">Check Out</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400">
                  No attendance found
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t hover:bg-gray-50 transition"
                >

                  {/* EMPLOYEE */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {row.employeeName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {row.employeeCode}
                    </div>
                  </td>

                  {/* DATE */}
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(row.attendance_date)}
                  </td>

                  {/* CHECK IN */}
                  <td className="px-4 py-3">
                    <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-medium">
                      {formatTime(row.check_in)}
                    </span>
                  </td>

                  {/* CHECK OUT */}
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-medium">
                      {formatTime(row.check_out)}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(row)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200 transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteClick(row.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* MODALS (unchanged) */}
    <AddAttendanceModal
      open={openAdd}
      onClose={() => setOpenAdd(false)}
      onSuccess={fetchAttendance}
    />

    <EditAttendanceModal
      open={openEdit}
      attendance={selectedRow}
      onClose={() => setOpenEdit(false)}
      onSuccess={fetchAttendance}
    />

    <ConfirmModal
      open={openDelete}
      title="Delete Attendance"
      message="Are you sure you want to delete this record?"
      onConfirm={handleDeleteConfirm}
      onClose={() => setOpenDelete(false)}
    />
  </div>
);
}
