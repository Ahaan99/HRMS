import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/common/StatCard";
import PageHeader from "../../components/common/PageHeader";
import { Plus, Pencil } from "lucide-react";
import LocationModal from "./LocationModal";

import {
  getLeads,
  createLead,
  updateLead,
  updateLocation,
} from "../../services/fieldSales.service";

export default function FieldSales() {
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [openLocation, setOpenLocation] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "all" });

  const emptyForm = {
    company_name: "",
    owner_name: "",
    phone: "",
    email: "",
    city: "",
    business_type: "",
    status: "new",
    next_followup_date: "",
    remarks: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ================= FETCH =================
  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await getLeads();
      setList(res.data.data || []);
    } catch (err) {
      console.log(err?.response?.data);
      toast.error(err?.response?.data?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // ================= STATS =================
  const stats = {
    total: list.length,
    // followups: list.filter((l) => l.next_followup_date).length,
    followups: list.filter(
      (l) =>
        l.next_followup_date && new Date(l.next_followup_date) >= new Date(),
    ).length,
    interested: list.filter((l) => l.status === "interested").length,
    closed: list.filter((l) => l.status === "closed").length,
  };

  // ================= FILTER =================
  let displayList = [...list];

  if (filters.search) {
    const s = filters.search.toLowerCase();
    displayList = displayList.filter(
      (l) =>
        l.company_name?.toLowerCase().includes(s) ||
        l.phone?.toLowerCase().includes(s) ||
        l.owner_name?.toLowerCase().includes(s),
    );
  }

  if (filters.status !== "all") {
    displayList = displayList.filter((l) => l.status === filters.status);
  }

  // ================= ADD =================
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createLead(form);
      toast.success("Lead added");
      setShowAdd(false);
      setForm(emptyForm);
      setForm(emptyForm);
      fetchList();
    } catch {
      toast.error("Add failed");
    }
  };

  // ================= EDIT =================
  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      ...emptyForm,
      ...row,

      // 🔥 FIX DATE FORMAT
      next_followup_date: row.next_followup_date
        ? row.next_followup_date.split("T")[0]
        : "",
    });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateLead(editRow.id, form);
      toast.success("Updated");
      setShowEdit(false);
      setEditRow(null);
      setForm(emptyForm);
      fetchList();
    } catch {
      toast.error("Update failed");
    }
  };

const handleSaveLocation = async (id, location) => {
  try {
    await updateLocation(id, {
      latitude: location.lat,
      longitude: location.lng,
      address: location.address,
    });

    toast.success("Location saved");
    fetchList();
  } catch (err) {
    console.error(err);
    toast.error("Save failed");
  }
};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Sales"
        desc="Manage company leads collected by BDM"
      />

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.total}
          gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
          icon="📊"
        />

        <StatCard
          title="Follow Ups"
          value={stats.followups}
          gradient="bg-gradient-to-tr from-gray-500 to-gray-700"
          icon="🆕"
        />

        <StatCard
          title="Interested"
          value={stats.interested}
          gradient="bg-gradient-to-tr from-emerald-500 to-green-600"
          icon="🔥"
        />

        <StatCard
          title="Deal Done"
          value={stats.closed}
          gradient="bg-gradient-to-tr from-indigo-500 to-purple-600"
          icon="✅"
        />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white rounded-2xl shadow p-4 flex justify-between">
        <div className="flex gap-3">
          <input
            placeholder="Search..."
            className="border px-3 py-2 rounded-lg"
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value }))
            }
          />

          <select
            className="border px-3 py-2 rounded-lg"
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="interested">Interested</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <button
          onClick={() => {
            setForm(emptyForm);
            setShowAdd(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow p-5 overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm border">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="th">Company</th>
              <th className="th">Owner</th>
              <th className="th">Phone</th>
              <th className="th">City</th>
              <th className="th">Business</th>
              <th className="th">Status</th>
              <th className="th">Follow Up</th>
              <th className="th">Action</th>
              <th className="th">Location</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8">Loading...</td>
              </tr>
            ) : (
              displayList.map((l) => (
                <tr key={l.id}>
                  <td className="td">{l.company_name}</td>
                  <td className="td">{l.owner_name}</td>
                  <td className="td">{l.phone}</td>
                  <td className="td">{l.city}</td>
                  <td className="td">{l.business_type}</td>
                  <td className="td">{l.status}</td>
                  <td className="td">
                    {l.next_followup_date
                      ? new Date(l.next_followup_date).toLocaleDateString(
                          "en-IN",
                        )
                      : "-"}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => openEdit(l)}
                      className="text-indigo-600"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>

                  <td className="td">
                    <button
                      onClick={() => {
                        setSelectedId(l.id);
                        setOpenLocation(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded-md text-xs"
                    >
                      📍 Location
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODALS ================= */}
      {showAdd && (
        <Modal
          title="Add Lead"
          onClose={() => setShowAdd(false)}
          onSubmit={handleAdd}
          form={form}
          setForm={setForm}
        />
      )}

      {showEdit && (
        <Modal
          title="Edit Lead"
          onClose={() => setShowEdit(false)}
          onSubmit={handleEdit}
          form={form}
          setForm={setForm}
        />
      )}

      <LocationModal
        open={openLocation}
        onClose={() => setOpenLocation(false)}
        onSave={handleSaveLocation}
        leadId={selectedId}
        existingData={list.find((l) => l.id === selectedId)}
      />
    </div>
  );
}

// ================= MODAL =================
function Modal({ title, onClose, onSubmit, form, setForm }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 ">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
          {/* Company */}
          <div>
            <label className="label">Company Name *</label>
            <input
              name="company_name"
              required
              value={form.company_name}
              onChange={handleChange}
              className="input"
              placeholder="Enter company name"
            />
          </div>

          {/* Owner */}
          <div>
            <label className="label">Owner Name</label>
            <input
              name="owner_name"
              value={form.owner_name}
              onChange={handleChange}
              className="input"
              placeholder="Owner name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone *</label>
            <input
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="input"
              placeholder="Phone number"
            />
          </div>

          {/* Alternate */}
          <div>
            <label className="label">Alternate Phone</label>
            <input
              name="alternate_phone"
              value={form.alternate_phone}
              onChange={handleChange}
              className="input"
              placeholder="Optional"
            />
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input"
              placeholder="Email"
            />
          </div>

          {/* City */}
          <div>
            <label className="label">City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className="input"
              placeholder="City"
            />
          </div>

          {/* Business */}
          <div>
            <label className="label">Business Type</label>
            <input
              name="business_type"
              value={form.business_type}
              onChange={handleChange}
              className="input"
              placeholder="e.g. IT, Retail"
            />
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="input"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Followup */}
          <div>
            <label className="label">Next Follow-up</label>
            <input
              type="date"
              name="next_followup_date"
              value={form.next_followup_date}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Address FULL WIDTH */}
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input"
              placeholder="Full address"
            />
          </div>

          {/* Requirement */}
          <div className="col-span-2">
            <label className="label">Requirement</label>
            <textarea
              name="requirement"
              value={form.requirement}
              onChange={handleChange}
              className="input"
              placeholder="What client needs"
            />
          </div>

          {/* Remarks */}
          <div className="col-span-2">
            <label className="label">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              className="input"
              placeholder="Notes..."
            />
          </div>

          {/* ACTION */}
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
