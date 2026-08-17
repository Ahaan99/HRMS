import { useEffect, useState } from "react";
import { FileSignature, Download } from "lucide-react";
import API from "../../services/api";

export default function OfferLetters() {
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    candidate_name: "",
    candidate_email: "",
    position: "",
    salary_monthly: "",
    joining_date: "",
    template: "standard",
  });

  const load = async () => {
    try {
      const [t, h] = await Promise.all([
        API.get("/client/leave-offer/offers/templates"),
        API.get("/client/leave-offer/offers"),
      ]);
      setTemplates(t.data.data || []);
      setHistory(h.data.data || []);
    } catch {
      setMsg("Failed to load offer letter data");
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await API.post("/client/leave-offer/offers/generate", form, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Offer-${form.candidate_name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash("Offer letter generated and downloaded");
      setForm({ candidate_name: "", candidate_email: "", position: "", salary_monthly: "", joining_date: "", template: "standard" });
      load();
    } catch (err) {
      flash("Generation failed. Check the required fields.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <FileSignature size={20} className="text-indigo-600" /> Offer Letters
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Issue offer letters using approved templates. Branding and terms are fixed per template.
      </p>

      {msg && (
        <div className="mb-4 text-sm px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <form onSubmit={generate} className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 h-fit">
          <h2 className="text-sm font-semibold text-gray-800">New Offer Letter</h2>
          <select
            value={form.template}
            onChange={(e) => setForm({ ...form, template: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            {templates.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <input required placeholder="Candidate name" value={form.candidate_name}
            onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
          <input type="email" placeholder="Candidate email (optional)" value={form.candidate_email}
            onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
          <input required placeholder="Position / role" value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
          <input type="number" min="0" placeholder="Monthly salary (INR, optional)" value={form.salary_monthly}
            onChange={(e) => setForm({ ...form, salary_monthly: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
          <label className="text-xs text-gray-500 -mb-2">Joining date</label>
          <input required type="date" value={form.joining_date}
            onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
          <button type="submit" disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50">
            <Download size={14} /> {busy ? "Generating..." : "Generate PDF"}
          </button>
        </form>

        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Issued Letters ({history.length})</h2>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-2.5 font-medium">Candidate</th>
                  <th className="px-4 py-2.5 font-medium">Position</th>
                  <th className="px-4 py-2.5 font-medium">Template</th>
                  <th className="px-4 py-2.5 font-medium">Joining</th>
                  <th className="px-4 py-2.5 font-medium">Issued</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No offer letters issued yet</td></tr>
                )}
                {history.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900">{o.candidate_name}</div>
                      <div className="text-xs text-gray-400">{o.candidate_email || ""}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{o.position}</td>
                    <td className="px-4 py-2.5 text-gray-600 capitalize">{o.template}</td>
                    <td className="px-4 py-2.5 text-gray-600">{new Date(o.joining_date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-gray-500">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
