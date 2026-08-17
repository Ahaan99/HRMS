import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ExternalLink,
  Settings2,
  Activity,
} from "lucide-react";

const ROBO_URL = import.meta.env.VITE_AI_ROBO_URL || "http://localhost:8001";

export default function AIPlatformAudit() {
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${ROBO_URL}/api/integration/proctor-logs`).then((r) => r.json()),
        fetch(`${ROBO_URL}/api/integration/summary`).then((r) => r.json()),
      ]);
      setLogs(r1.proctor_logs || []);
      setConfig(r1.config || {});
      setCandidates(r1.candidates || []);
      setSyncedAt(r1.synced_at);
      setSummary(r2);
    } catch {
      setError(
        "AI Interview Portal is not reachable. Make sure HR_robo is running on " + ROBO_URL,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const candOf = (id) => candidates.find((c) => c.id === id) || {};
  const integColor = (v) =>
    v >= 80 ? "text-emerald-600" : v >= 50 ? "text-amber-600" : "text-red-600";

  const CONFIG_LABELS = {
    maxWarnings: "Max warnings before termination",
    gazeEnabled: "Face monitoring (camera)",
    faceConsistency: "Face consistency check",
    speakerDetection: "Speaker detection",
    techMonitoring: "Technical monitoring",
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600" />
            AI Interview Platform — Audit &amp; Monitoring
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Superadmin control: platform integrity, proctoring audit &amp; configuration
            {syncedAt && ` · synced ${new Date(syncedAt).toLocaleString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <a
            href={ROBO_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 flex items-center gap-2"
          >
            <ExternalLink size={15} /> Open Portal
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* Monitoring widgets */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Proctored Interviews", value: logs.length },
            { label: "Avg Integrity", value: summary.avg_integrity != null ? `${summary.avg_integrity}%` : "—" },
            { label: "Auto-Terminated", value: summary.terminated },
            { label: "Candidates on Platform", value: summary.total_candidates },
          ].map((w) => (
            <div key={w.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-2xl font-bold text-gray-800">{w.value ?? "—"}</p>
              <p className="text-xs text-gray-500">{w.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Platform configuration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Settings2 size={16} className="text-indigo-600" /> Current Proctoring Configuration
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.keys(CONFIG_LABELS).map((k) => {
            const v = config[k];
            const on = typeof v === "boolean" ? v : v != null;
            return (
              <span
                key={k}
                className={`px-3 py-1.5 rounded-full border ${
                  on
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                {CONFIG_LABELS[k]}: {typeof v === "boolean" ? (v ? "ON" : "OFF") : (v ?? "default")}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Configuration is managed in the Interview Portal&apos;s Proctor Control panel.
        </p>
      </div>

      {/* Integrity audit table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Integrity</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Face Check</th>
                <th className="px-4 py-3">Violations</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Loading audit data…
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No proctored interviews recorded yet.
                  </td>
                </tr>
              )}
              {logs.map((l, i) => {
                const c = candOf(l.candidate_id);
                return (
                  <>
                    <tr key={i} className="border-b last:border-0 hover:bg-indigo-50/40">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {c.name || `#${l.candidate_id}`}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${integColor(l.integrity ?? 100)}`}>
                        <span className="inline-flex items-center gap-1">
                          {(l.integrity ?? 100) >= 80 ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <ShieldAlert size={14} />
                          )}
                          {l.integrity ?? 100}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {l.terminated ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            TERMINATED
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {l.face_consistency || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {(l.violations || []).length}
                        <span className="text-gray-400 text-xs"> / {(l.events || []).length} events</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {l.at ? new Date(l.at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setOpen(open === i ? null : i)}
                          className="text-indigo-600 text-xs font-medium hover:underline"
                        >
                          {open === i ? "Hide" : "Audit"}
                        </button>
                      </td>
                    </tr>
                    {open === i && (
                      <tr key={`d${i}`} className="bg-slate-50 border-b">
                        <td colSpan={7} className="px-6 py-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">
                            Violation log
                          </h4>
                          {(l.violations || []).length === 0 && (
                            <p className="text-xs text-gray-400">Clean record — no violations.</p>
                          )}
                          <ul className="space-y-1">
                            {(l.violations || []).map((v, j) => (
                              <li key={j} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-red-500 shrink-0">▸</span>
                                <span>
                                  <b>{v.type}</b>
                                  {v.at && ` · ${new Date(v.at).toLocaleTimeString()}`}
                                  {v.detail && ` · ${v.detail}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
