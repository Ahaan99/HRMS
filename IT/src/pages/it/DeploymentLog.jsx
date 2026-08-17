import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Rocket, Trash2 } from "lucide-react";
import API from "../../api/axios";
import ITShell from "./ITShell";

const ENVIRONMENTS = ["Development", "Staging", "Production"];
const STATUSES = ["Success", "Failed", "Rolled Back"];

const STATUS_BADGE = {
  Success: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  "Rolled Back": "bg-amber-100 text-amber-700",
};

const ENV_BADGE = {
  Production: "bg-indigo-100 text-indigo-700",
  Staging: "bg-blue-100 text-blue-700",
  Development: "bg-gray-100 text-gray-600",
};

export default function DeploymentLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    project: "",
    version_tag: "",
    environment: "Production",
    features: "",
    status: "Success",
  });

  const fetchAll = useCallback(async () => {
    try {
      const res = await API.get("/it/deployments");
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load deployments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/it/deployments", form);
      toast.success("Deployment logged");
      setForm({
        project: "",
        version_tag: "",
        environment: "Production",
        features: "",
        status: "Success",
      });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log deployment");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    try {
      await API.delete(`/it/deployments/${r.id}`);
      toast.success("Deployment deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const fmt = (d) =>
    new Date(d).toLocaleString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <ITShell
      title="Feature Deployment Log"
      subtitle="Track feature releases across environments"
      icon={Rocket}
    >
      {/* log form */}
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-2 md:grid-cols-6 gap-3 items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Project *</label>
          <input
            value={form.project}
            onChange={(e) =>
              setForm((f) => ({ ...f, project: e.target.value }))
            }
            placeholder="Project"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Version</label>
          <input
            value={form.version_tag}
            onChange={(e) =>
              setForm((f) => ({ ...f, version_tag: e.target.value }))
            }
            placeholder="v1.2.0"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Environment</label>
          <select
            value={form.environment}
            onChange={(e) =>
              setForm((f) => ({ ...f, environment: e.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {ENVIRONMENTS.map((env) => (
              <option key={env}>{env}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
          <label className="text-xs text-gray-500">Features</label>
          <input
            value={form.features}
            onChange={(e) =>
              setForm((f) => ({ ...f, features: e.target.value }))
            }
            placeholder="What shipped?"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-semibold transition"
        >
          {saving ? "Logging..." : "Log Deployment"}
        </button>
      </form>

      {/* history table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Features</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Deployed By</th>
              <th className="px-4 py-3">Deployed At</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No deployments logged yet
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.project}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.version_tag || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ENV_BADGE[r.environment] || "bg-gray-100 text-gray-600"}`}
                    >
                      {r.environment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[240px] truncate">
                    {r.features || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.deployed_by || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {fmt(r.deployed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove(r)}
                      aria-label={`Delete deployment ${r.project}`}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ITShell>
  );
}
