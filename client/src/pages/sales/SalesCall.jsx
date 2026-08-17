import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import StatCard from "../../components/common/StatCard";
import { useNavigate } from "react-router-dom";
import {
  PhoneCall,
  TrendingUp,
  IndianRupee,
  BellRing,
  CalendarClock,
  AlertTriangle,
  Plus,
  Pencil,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { useClientAuth } from "../../context/ClientAuthContext";
import PageHeader from "../../components/common/PageHeader";

export default function SalesCall() {
  const token = localStorage.getItem("hrms_client_Token");
  const { client } = useClientAuth();
  const isEmployee = client?.role === "CLIENT_EMPLOYEE";

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [employees, setEmployees] = useState([]);

  const [filters, setFilters] = useState({ search: "", status: "all" });
  const navigate = useNavigate();
  const emptyForm = {
    employee_id: "",
    call_id: "",
    customer_name: "",
    phone: "",
    email: "",
    call_time: "",
    call_date: "",
    status: "hold",
    follow_up_datetime: "",
    remarks: "",
    sold_date: "",
  };

  const [form, setForm] = useState(emptyForm);
  // ================= FETCH EMPLOYEES =================

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/client/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      toast.error("Employees fetch error:", err);
    }
  };

  // ================= FETCH =================
  const fetchList = async (extra = {}) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/client/sales`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...filters, ...extra },
      });
      if (res.data?.success) setList(res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();

    if (!isEmployee) {
      fetchEmployees(); // ✅ only admin
    }
  }, []);
  // ================= STATS =================
  const now = new Date();
  const stats = {
    totalCalls: list.length,
    leadsGenerated: list.filter((r) => r.status === "accepted").length,
    totalSales: list.filter((r) => r.sold_date).length,
    needFollowups: list.filter(
      (r) =>
        r.follow_up_datetime &&
        new Date(r.follow_up_datetime) >= now &&
        r.status !== "rejected",
    ).length,
    totalFollowups: list.filter(
      (r) => r.follow_up_datetime && r.status !== "rejected",
    ).length,
    pendingFollowups: list.filter(
      (r) =>
        r.follow_up_datetime &&
        new Date(r.follow_up_datetime) < now &&
        r.status !== "rejected",
    ).length,
  };

  // ================= CARD FILTER =================
  const applyCardFilter = (type) => {
    setActiveFilter(type);
    if (type === "all") return fetchList();
    if (type === "leads") return fetchList({ status: "accepted" });
    return fetchList();
  };

  // ================= SEARCH =================
  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters((p) => ({ ...p, search: value }));
    fetchList({ search: value });
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setFilters((p) => ({ ...p, status: value }));
    fetchList({ status: value });
  };

  // ================= ADD =================
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/client/sales`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Record added");
      setShowAdd(false);
      setForm(emptyForm);
      fetchList();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Add failed");
    }
  };

  // ================= EDIT =================

  const formatForInput = (val) => {
    if (!val) return "";
    return new Date(val).toISOString().slice(0, 16);
  };

  const openEdit = (row) => {
    setEditRow(row);

    setForm({
      ...row,
      call_date: row.call_date?.slice(0, 10) || "",
      sold_date: row.sold_date?.slice(0, 10) || "",
      follow_up_datetime: formatForInput(row.follow_up_datetime),
    });

    setShowEdit(true);
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BASE_URL}/client/sales/${editRow.id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Record updated");
      setShowEdit(false);
      setEditRow(null);
      setForm(emptyForm);
      fetchList();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  // ================= DISPLAY FILTER =================
  let displayList = [...list];

  if (filters.search) {
    const s = filters.search.toLowerCase();
    displayList = displayList.filter(
      (r) =>
        r.customer_name?.toLowerCase().includes(s) ||
        r.phone?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        r.call_id?.toLowerCase().includes(s) ||
        r.employee_name?.toLowerCase().includes(s),
    );
  }

  if (activeFilter === "sales")
    displayList = displayList.filter((r) => r.sold_date);

  if (activeFilter === "followups")
    displayList = displayList.filter(
      (r) => r.follow_up_datetime && r.status !== "rejected",
    );

  if (activeFilter === "pending")
    displayList = displayList.filter(
      (r) =>
        r.follow_up_datetime &&
        new Date(r.follow_up_datetime) < now &&
        r.status !== "rejected",
    );

  if (activeFilter === "need")
    displayList = displayList.filter(
      (r) =>
        r.follow_up_datetime &&
        new Date(r.follow_up_datetime) >= now &&
        r.status !== "rejected",
    );

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";
    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dt) => {
    if (!dt) return "-";
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales calls"
        desc="View sales analytics and subscription revenue."
      />

      <button
        onClick={() => navigate("/sales-report")}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Go to Sales Reports
      </button>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Calls"
          value={stats.totalCalls}
          subText="All client calls"
          icon={<PhoneCall size={26} />}
          gradient="bg-gradient-to-r from-blue-500/90 to-indigo-500/90"
          onClick={() => applyCardFilter("all")}
        />
        <StatCard
          title="Lead Generated"
          value={stats.leadsGenerated}
          subText="Accepted leads"
          icon={<TrendingUp size={26} />}
          gradient="bg-gradient-to-r from-emerald-500/90 to-green-500/90"
          onClick={() => applyCardFilter("leads")}
        />
        <StatCard
          title="Total Sales"
          value={stats.totalSales}
          subText="Converted deals"
          icon={<IndianRupee size={26} />}
          gradient="bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90"
          onClick={() => applyCardFilter("sales")}
        />
        <StatCard
          title="Need Follow-ups"
          value={stats.needFollowups}
          subText="Upcoming follow-ups"
          icon={<BellRing size={26} />}
          gradient="bg-gradient-to-r from-orange-500/90 to-red-500/90"
          onClick={() => applyCardFilter("need")}
        />
        <StatCard
          title="Total Follow-ups"
          value={stats.totalFollowups}
          subText="All scheduled"
          icon={<CalendarClock size={26} />}
          gradient="bg-gradient-to-r from-cyan-500/90 to-sky-500/90"
          onClick={() => applyCardFilter("followups")}
        />
        <StatCard
          title="Pending Follow-ups"
          value={stats.pendingFollowups}
          subText="Overdue tasks"
          icon={<AlertTriangle size={26} />}
          gradient="bg-gradient-to-r from-rose-500/90 to-pink-500/90"
          onClick={() => applyCardFilter("pending")}
        />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Search name, phone, employee..."
            className="border rounded-lg px-3 py-2 w-72"
            value={filters.search}
            onChange={handleSearch}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="all">All Status</option>
            <option value="hold">Hold</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={() => {
            setForm(emptyForm); // 🔥 reset form
            setEditRow(null); // safety
            setShowAdd(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          <Plus size={16} /> Add Call
        </button>
      </div>

      {/* ================= TABLE ================= */}

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden w-screen sm:max-w-[calc(100vw-288px-40px)]">
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-[1200px] w-full text-sm">
            {/* HEADER */}
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">Call</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Follow Up</th>
                <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                <th className="px-4 py-3 text-left font-semibold">Sold</th>
                <th className="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                displayList.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    {/* ID */}
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      #{row.call_id}
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {row.customer_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {row.email || "-"}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        📞 {row.phone}
                      </div>
                    </td>

                    {/* EMPLOYEE */}
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {row.employee_name}
                    </td>

                    {/* CALL DATE + TIME */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-800">
                        {formatTime(row.call_time)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(row.call_date)}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          row.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : row.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* FOLLOW UP */}
                    <td className="px-4 py-3">
                      <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-xs font-medium">
                        {formatDateTime(row.follow_up_datetime)}
                      </span>
                    </td>

                    {/* REMARKS */}
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {row.remarks || "-"}
                    </td>

                    {/* SOLD */}
                    <td className="px-4 py-3">
                      {row.sold_date ? (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium">
                          {formatDate(row.sold_date)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEdit(row)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs mx-auto hover:bg-indigo-700 transition"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD MODAL ================= */}
      {showAdd && (
        <Modal
          title="Add Call"
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddSubmit}
          form={form}
          setForm={setForm}
          employees={employees}
        />
      )}

      {/* ================= EDIT MODAL ================= */}
      {showEdit && (
        <Modal
          title="Edit Call"
          onClose={() => setShowEdit(false)}
          onSubmit={handleEditSubmit}
          form={form}
          setForm={setForm}
          employees={employees}
        />
      )}
    </div>
  );
}

// ================= SHARED MODAL =================
function Modal({ title, onClose, onSubmit, form, setForm, employees }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
          {/* Employee */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Employee</label>
            <select
              name="employee_id"
              value={form.employee_id || ""}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Call ID */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Call ID</label>
            <input
              name="call_id"
              placeholder="(optional)"
              className="border rounded-lg px-3 py-2"
              value={form.call_id || ""}
              onChange={handleChange}
            />
          </div>

          {/* Customer Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Customer Name</label>
            <input
              name="customer_name"
              className="border rounded-lg px-3 py-2"
              value={form.customer_name || ""}
              onChange={handleChange}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Phone</label>
            <input
              name="phone"
              className="border rounded-lg px-3 py-2"
              value={form.phone || ""}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              className="border rounded-lg px-3 py-2"
              value={form.email || ""}
              onChange={handleChange}
            />
          </div>

          {/* Call Time */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Call Time</label>
            <input
              name="call_time"
              type="time"
              className="border rounded-lg px-3 py-2"
              value={form.call_time || ""}
              onChange={handleChange}
            />
          </div>

          {/* Call Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Call Date</label>
            <input
              name="call_date"
              type="date"
              className="border rounded-lg px-3 py-2"
              value={form.call_date || ""}
              onChange={handleChange}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              className="border rounded-lg px-3 py-2"
              value={form.status || "hold"}
              onChange={handleChange}
            >
              <option value="hold">Hold</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Follow Up */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              Follow Up Date & Time
            </label>
            <input
              name="follow_up_datetime"
              type="datetime-local"
              className="border rounded-lg px-3 py-2"
              value={form.follow_up_datetime || ""}
              onChange={handleChange}
            />
          </div>

          {/* Sold Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Sold Date</label>
            <input
              name="sold_date"
              type="date"
              className="border rounded-lg px-3 py-2"
              value={form.sold_date || ""}
              onChange={handleChange}
            />
          </div>

          {/* Remarks */}
          <div className="flex flex-col col-span-2">
            <label className="text-sm font-medium mb-1">Remarks</label>
            <textarea
              name="remarks"
              rows="3"
              className="border rounded-lg px-3 py-2"
              value={form.remarks || ""}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
