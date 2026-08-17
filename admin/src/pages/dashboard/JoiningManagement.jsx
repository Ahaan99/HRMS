import { useEffect, useState } from "react";
import axios from "axios";
import {
  Trash2,
  Pencil,
  Eye,
  UserPlus,
  X
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";

import JoiningDetailsModal from "../../components/joining/JoiningDetailsModal";
import EditJoiningModal from "../../components/joining/EditJoiningModal";
import { getDepartments, getDesignations } from "../../services/masterService";

const BASE = import.meta.env.VITE_API_BASE_URL;

export default function JoiningManagement() {


  const token = localStorage.getItem("hrms_admin_token");

  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  // MASTER DATA
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    dob: "",
    gender: "",
    marital_status: "",
    mobile: "",
    email: "",
    present_address: "",
    present_city: "",
    departmentId: "",
    designationId: "",
    photo: null,
    signature: null,
    total_experience: "",
  });

  /* =========================
      MASTER DATA FETCH
  ========================= */
  const fetchMasterData = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        getDepartments(),
        getDesignations(),
      ]);
      setDepartments(deptRes.data?.departments || []);
      setDesignations(desigRes.data?.designations || []);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  /* =========================
      JOINING LIST
  ========================= */
  const fetchJoinings = async () => {
    try {
      const res = await axios.get(`${BASE}/super-admin/joining`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching joinings:", err);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchJoinings();
  }, []);

  /* =========================
      DELETE
  ========================= */
  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(`${BASE}/super-admin/joining/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchJoinings();
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  /* =========================
      CREATE / SUBMIT
  ========================= */
  const handleCreate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const fd = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== undefined) {
        fd.append(key, form[key]);
      }
    });

    try {
      await axios.post(`${BASE}/super-admin/joining`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setAddOpen(false);

      // Reset form state
      setForm({
        full_name: "",
        father_name: "",
        dob: "",
        gender: "",
        marital_status: "",
        mobile: "",
        email: "",
        present_address: "",
        present_city: "",
        departmentId: "",
        designationId: "",
        photo: null,
        signature: null,
        total_experience: "",
      });

      fetchJoinings();
    } catch (err) {
      console.error("Error creating record:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files[0] }));
  };

  return (

    <DashboardLayout>
    <div className="p-6 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Joining Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage and audit onboarded employee parameters
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl"
        >
          <UserPlus size={16} />
          Add Employee
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border">
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-[1200px] w-max">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="bg-slate-50 text-xs uppercase">
                <th className="p-4">Employee Profile</th>
                <th className="p-4">Department & Designation</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Location</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const deptObj = departments.find(
                  (d) => Number(d.id) === Number(row.departmentId)
                );
                const desigObj = designations.find(
                  (d) => Number(d.id) === Number(row.designationId)
                );

                return (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                          {row.photo ? (
                            <img
                              src={`http://localhost:5000/uploads/profile/${row.photo}`}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-600">
                              {row.full_name?.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-700">{row.full_name}</div>
                          <div className="text-xs text-slate-400">#{row.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {deptObj?.name || "-"} / {desigObj?.name || "-"}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <div>{row.mobile}</div>
                      <div className="text-xs text-slate-400">{row.email}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{row.present_city || "-"}</td>
                    <td className="p-4 flex gap-3 text-slate-500">
                      <button className="hover:text-indigo-600 transition" onClick={() => setSelected(row)}>
                        <Eye size={16} />
                      </button>
                      <button className="hover:text-amber-600 transition" onClick={() => setEditData(row)}>
                        <Pencil size={16} />
                      </button>
                      <button className="hover:text-rose-600 transition" onClick={() => handleDelete(row.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      <JoiningDetailsModal
        data={selected}
        onClose={() => setSelected(null)}
        BASE={import.meta.env.VITE_UPLOADS_BASE_URL}
      />

      {/* EDIT MODAL */}
      <EditJoiningModal
        open={!!editData}
        data={editData}
        onClose={() => setEditData(null)}
        onSuccess={fetchJoinings}
        departmentOptions={departments}
        designationOptions={designations}
      />

      {/* INLINE ADD EMPLOYEE MODAL (No external file needed) */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">Add New Employee</h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input type="text" name="full_name" value={form.full_name} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Father's Name</label>
                  <input type="text" name="father_name" value={form.father_name} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile</label>
                  <input type="text" name="mobile" value={form.mobile} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                  <input type="date" name="dob" value={form.dob} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select name="gender" value={form.gender} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <select name="departmentId" value={form.departmentId} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600">
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                  <select name="designationId" value={form.designationId} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600">
                    <option value="">Select Designation</option>
                    {designations.map(desig => (
                      <option key={desig.id} value={desig.id}>{desig.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Present City</label>
                  <input type="text" name="present_city" value={form.present_city} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Total Experience</label>
                  <input type="text" name="total_experience" value={form.total_experience} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Photo</label>
                  <input type="file" name="photo" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Signature</label>
                  <input type="file" name="signature" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Present Address</label>
                <textarea name="present_address" value={form.present_address} onChange={handleInputChange} rows="2" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold">
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
}