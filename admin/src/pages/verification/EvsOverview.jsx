import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";

const EVS_API = import.meta.env.VITE_EVS_API_URL || "http://localhost:8000";
const EVS_APP = import.meta.env.VITE_EVS_APP_URL || "http://localhost:5173";

const TONE = {
  "Fully Verified": "bg-emerald-50 text-emerald-700",
  "In Progress": "bg-amber-50 text-amber-700",
  "Action Required": "bg-red-50 text-red-700",
  "Not Started": "bg-gray-100 text-gray-600",
};

const CELL_TONE = {
  Verified: "bg-emerald-50 text-emerald-700",
  Validated: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  "Pending Approval": "bg-amber-50 text-amber-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
  "Not Submitted": "bg-gray-100 text-gray-500",
  "Not Started": "bg-gray-100 text-gray-500",
};

function Pill({ value }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
        CELL_TONE[value] || "bg-gray-100 text-gray-600"
      }`}
    >
      {value || "-"}
    </span>
  );
}

export default function EvsOverview() {
  const [status, setStatus] = useState(null);
  const [hrms, setHrms] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [v, h] = await Promise.all([
        axios.get(`${EVS_API}/verification-status`, { timeout: 5000 }),
        axios.get(`${EVS_API}/hrms-status`, { timeout: 5000 }),
      ]);
      setStatus(v.data);
      setHrms(h.data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const s = status?.summary;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
          <ShieldCheck size={20} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-base font-bold text-gray-900">
            Employee Verification Portal
          </h2>
          <p className="text-xs text-gray-500">
            Live status from the verification system
            {hrms?.connected &&
              ` - ${hrms.synced}/${hrms.hrms_employees} HRMS employees synced`}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
        <a
          href={EVS_APP}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Open Verification Portal <ExternalLink size={14} />
        </a>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
          Verification system is offline (port 8000). Start the EVS backend to
          see live status.
        </div>
      )}

      {!error && s && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {[
              ["Employees", s.total, "text-gray-900"],
              ["Fully Verified", s.fully_verified, "text-emerald-600"],
              ["In Progress", s.in_progress, "text-amber-600"],
              ["Action Required", s.action_required, "text-red-600"],
              ["Not Started", s.not_started, "text-gray-500"],
            ].map(([label, value, tone]) => (
              <div
                key={label}
                className="border border-gray-100 rounded-xl px-3 py-2.5"
              >
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {label}
                </div>
                <div className={`text-xl font-extrabold ${tone}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="max-h-[340px] overflow-y-auto overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#f3f4f6]">
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 px-3 font-semibold">Employee</th>
                  <th className="py-2 pr-3 font-semibold">Aadhaar</th>
                  <th className="py-2 pr-3 font-semibold">PAN</th>
                  <th className="py-2 pr-3 font-semibold">Documents</th>
                  <th className="py-2 pr-3 font-semibold">Background</th>
                  <th className="py-2 pr-3 font-semibold">History</th>
                  <th className="py-2 pr-3 font-semibold">Overall</th>
                </tr>
              </thead>
              <tbody>
                {(status.employees || []).map((emp) => (
                  <tr
                    key={emp.employee_id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 font-semibold text-gray-800 whitespace-nowrap">
                      {emp.employee_name}
                      <div className="text-[11px] font-normal text-gray-400">
                        {emp.department}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.aadhaar} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.pan} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.documents} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.background} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.employment_history} />
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                          TONE[emp.overall] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {emp.overall}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-400 pt-2">
            {(status.employees || []).length} employees - scroll inside the
            table to see all rows and columns.
          </div>
        </>
      )}
    </div>
  );
}
