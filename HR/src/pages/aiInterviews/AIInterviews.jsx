import { useEffect, useState, useCallback } from "react";
import HRNavbar from "../../components/hr/HRNavbar";
import { Bot, RefreshCw, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";

const ROBO_URL = import.meta.env.VITE_AI_ROBO_URL || "http://localhost:8001";

const VERDICT_STYLES = {
  "STRONG HIRE": "bg-emerald-100 text-emerald-700",
  HIRE: "bg-green-100 text-green-700",
  CONSIDER: "bg-amber-100 text-amber-700",
  "NOT RECOMMENDED": "bg-red-100 text-red-700",
};

export default function AIInterviews() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${ROBO_URL}/api/integration/reports`).then((r) => r.json()),
        fetch(`${ROBO_URL}/api/integration/summary`).then((r) => r.json()),
      ]);
      setData(r1);
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

  const reports = data?.reports || [];
  const candidates = data?.candidates || [];
  const candOf = (id) => candidates.find((c) => c.id === id) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pb-10">
      <HRNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">AI Robot Interviews</h2>
              <p className="text-xs text-gray-500">
                Candidate scores, assessments &amp; hire recommendations from the AI Interview Portal
                {data?.synced_at && ` · synced ${new Date(data.synced_at).toLocaleString()}`}
              </p>
            </div>
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
              <ExternalLink size={15} /> Open Interview Portal
            </a>
          </div>
        </div>

        {/* Summary widgets */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Interviews Done", value: summary.total_interviews },
              { label: "Candidates", value: summary.total_candidates },
              { label: "Avg Integrity", value: summary.avg_integrity != null ? `${summary.avg_integrity}%` : "—" },
              { label: "Terminated", value: summary.terminated },
            ].map((w) => (
              <div key={w.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-2xl font-bold text-gray-800">{w.value ?? "—"}</p>
                <p className="text-xs text-gray-500">{w.label}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Reports table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Integrity</th>
                  <th className="px-4 py-3">Recommendation</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Loading interview results…
                    </td>
                  </tr>
                )}
                {!loading && reports.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No AI interviews completed yet. Schedule one from the Interview Portal.
                    </td>
                  </tr>
                )}
                {reports.map((r, i) => {
                  const c = candOf(r.candidate_id);
                  const rec = r.recommendation || {};
                  const integ = rec.integrity;
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-indigo-50/40">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {c.name || `#${r.candidate_id}`}
                        <p className="text-xs text-gray-400 font-normal">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.position_title || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {rec.composite ?? r.interview_score ?? "—"}%
                      </td>
                      <td className="px-4 py-3">
                        {integ != null ? (
                          <span className={`inline-flex items-center gap-1 ${integ >= 80 ? "text-emerald-600" : integ >= 50 ? "text-amber-600" : "text-red-600"}`}>
                            {integ >= 80 ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                            {integ}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${VERDICT_STYLES[rec.verdict] || "bg-gray-100 text-gray-600"}`}>
                          {rec.verdict || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(selected === i ? null : i)}
                          className="text-indigo-600 text-xs font-medium hover:underline"
                        >
                          {selected === i ? "Hide" : "Review"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail drawer */}
          {selected != null && reports[selected] && (
            <div className="border-t bg-slate-50 p-5">
              {(() => {
                const r = reports[selected];
                const rec = r.recommendation || {};
                return (
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Assessment</h4>
                      <ul className="space-y-1 text-gray-600">
                        {(rec.reasons || []).map((reason, j) => (
                          <li key={j} className="flex gap-2">
                            <span className="text-indigo-500 shrink-0">•</span>
                            {reason}
                          </li>
                        ))}
                        {!(rec.reasons || []).length && <li className="text-gray-400">No assessment notes.</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Skill Scores</h4>
                      <div className="space-y-2">
                        {Object.entries(r.skill_scores || {}).map(([skill, score]) => (
                          <div key={skill}>
                            <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                              <span>{skill}</span>
                              <span>{score}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {!Object.keys(r.skill_scores || {}).length && (
                          <p className="text-gray-400 text-xs">No per-skill scores recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
