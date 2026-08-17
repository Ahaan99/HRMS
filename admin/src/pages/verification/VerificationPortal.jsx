import { useEffect, useState, useCallback } from "react";
import ExportButton from "../../components/common/ExportButton";
import EvsOverview from "./EvsOverview";
import axios from "axios";
import { FileCheck2, Upload, Trash2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FILE_BASE = BASE_URL.replace(/\/api$/, "");

const DOC_TYPES = [
  "Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID",
  "Education Certificate", "Experience Letter", "Relieving Letter",
  "Salary Slip", "Bank Statement", "Address Proof", "Photo", "Other",
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const btnCls = "inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50";

const TONE = {
  Pending: "bg-amber-50 text-amber-700",
  Verified: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

export default function VerificationPortal() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [docs, setDocs] = useState([]);
  const [counts, setCounts] = useState({});
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee_id: "", doc_type: "Aadhaar Card", file: null });

  const load = useCallback(async () => {
    try {
      const [d, e] = await Promise.all([
        axios.get(`${BASE_URL}/verification${filter ? `?status=${filter}` : ""}`, { headers }),
        axios.get(`${BASE_URL}/super-admin/employees`, { headers }),
      ]);
      setDocs(d.data.documents);
      setCounts(d.data.counts || {});
      setEmployees(Array.isArray(e.data) ? e.data : e.data?.employees || e.data?.data || []);
    } catch (err) {
      console.error("Load error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const uploadDoc = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("employee_id", form.employee_id);
      fd.append("employee_name", employees.find((e) => String(e.id) === String(form.employee_id))?.name || "");
      fd.append("doc_type", form.doc_type);
      if (form.file) fd.append("file", form.file);
      await axios.post(`${BASE_URL}/verification`, fd, { headers });
      setForm({ employee_id: "", doc_type: "Aadhaar Card", file: null });
      document.getElementById("verif-file-input").value = "";
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const review = async (id, status) => {
    let remarks = null;
    if (status === "Rejected") {
      remarks = prompt("Reason for rejection:");
      if (remarks === null) return;
    }
    await axios.put(`${BASE_URL}/verification/${id}/review`, { status, remarks }, { headers });
    await load();
  };

  const del = async (id) => {
    if (!confirm("Delete this document?")) return;
    await axios.delete(`${BASE_URL}/verification/${id}`, { headers });
    await load();
  };

  return (
    <div className="p-6 space-y-6">
      <EvsOverview />
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
          <FileCheck2 className="text-indigo-600" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employee Verification Portal</h1>
          <p className="text-sm text-gray-500">Upload, verify and track employee documents.</p>
        </div>
        <ExportButton data={docs} filename="verification-documents" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          ["Pending", counts.pending, "text-amber-600"],
          ["Verified", counts.verified, "text-emerald-600"],
          ["Rejected", counts.rejected, "text-red-600"],
        ].map(([l, v, tone]) => (
          <div key={l} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">{l}</p>
            <p className={`text-2xl font-bold mt-1 ${tone}`}>{v ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-900 mb-4">Upload Document</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className={inputCls} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
            <option value="">Select employee *</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className={inputCls} value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
            {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input id="verif-file-input" className={inputCls} type="file" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
        </div>
        <button className={`${btnCls} mt-4`} disabled={saving || !form.employee_id} onClick={uploadDoc}>
          <Upload size={15} /> {saving ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {["", "Pending", "Verified", "Rejected"].map((s) => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === s ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>{["Employee", "Document", "File", "Status", "Remarks", "Reviewed By", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{d.employee_name}</td>
                <td className="px-4 py-3">{d.doc_type}</td>
                <td className="px-4 py-3">
                  {d.file_path ? (
                    <a href={`${FILE_BASE}${d.file_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                      View <ExternalLink size={12} />
                    </a>
                  ) : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold rounded-full px-2 py-1 ${TONE[d.status]}`}>{d.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{d.remarks || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{d.verified_by || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {d.status === "Pending" && (
                      <>
                        <button onClick={() => review(d.id, "Verified")} title="Verify" className="text-emerald-500 hover:text-emerald-700"><CheckCircle2 size={17} /></button>
                        <button onClick={() => review(d.id, "Rejected")} title="Reject" className="text-red-400 hover:text-red-600"><XCircle size={17} /></button>
                      </>
                    )}
                    {d.status !== "Pending" && (
                      <button onClick={() => review(d.id, "Pending")} className="text-xs font-semibold text-gray-500 hover:underline">Reopen</button>
                    )}
                    <button onClick={() => del(d.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!docs.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No documents {filter ? `with status "${filter}"` : "uploaded yet"}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
