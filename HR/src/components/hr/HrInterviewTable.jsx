import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Search, Download, FileText, Pencil, Inbox } from "lucide-react";

const controlCls =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25";

export default function HrInterviewTable({
  rows = [],
  loading,
  onEdit,
  locations = [],
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    call_status: "",
    client_status: "",
    location: "",
    job_profile: "",
    created_at: "",
    language_id: "",
    joined: "",
  });

  const callStatusMap = {
    1: "NOT PICKED",
    2: "SWITCHED OFF",
    3: "CALL BACK",
    4: "INTERESTED",
    5: "NOT INTERESTED",
    6: "INTERVIEW SCHEDULED",
    7: "SELECTED",
    8: "REJECTED",
    9: "NOT REACHABLE",
  };

  const filteredRows = rows.filter((item) => {
    const matchesSearch =
      item.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.candidate_email?.toLowerCase().includes(search.toLowerCase());

    const matchesCallStatus =
      !filters.call_status ||
      String(item.call_status_id) === filters.call_status;

    const matchesClientStatus =
      !filters.client_status || item.client_status === filters.client_status;

    const matchesLocation =
      !filters.location ||
      item.location?.toLowerCase() === filters.location.toLowerCase();

    const matchesJobProfile =
      !filters.job_profile || item.job_profile === filters.job_profile;

    const matchesCreatedDate =
      !filters.created_at ||
      (item.created_at &&
        new Date(item.created_at).toISOString().split("T")[0] ===
          filters.created_at);

    const matchesLanguage =
      !filters.language_id || String(item.language_id) === filters.language_id;

    const matchesJoined =
      !filters.joined || String(item.joined) === filters.joined;
    return (
      matchesSearch &&
      matchesCallStatus &&
      matchesClientStatus &&
      matchesLocation &&
      matchesJobProfile &&
      matchesCreatedDate &&
      matchesLanguage &&
      matchesJoined
    );
  });

  const handleDownload = () => {
    if (!filteredRows.length) return;

    const data = filteredRows.map((item) => ({
      Name: item.candidate_name,
      Phone: item.candidate_phone,
      Location: item.location || "-",
      Address: item.address || "-",
      Language: item.language_name || "-",
      Job: item.job_profile || "-",
      Experience: item.experience || "-",
      Current_CTC: item.current_ctc || "-",
      Expected_CTC: item.expected_ctc || "-",
      Notice: item.notice_period || "-",
      Client_Code: item.client_code,
      Call_Status: callStatusMap[item.call_status_id] || "-",
      Interview_Date: item.interview_date
        ? new Date(item.interview_date).toLocaleDateString("en-IN")
        : "-",
      Call_Date: new Date(item.created_at).toLocaleDateString("en-IN"),
      Call_Time: new Date(item.created_at).toLocaleTimeString("en-IN"),
      Status: item.client_status || "-",
      Client_Remarks: item.client_remarks || "-",
      HR_Remarks: item.hr_remarks || "-",
      Joined: item.joined || "No",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Interviews");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, `Interviews_${Date.now()}.xlsx`);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ── TOOLBAR ─────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search name / email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${controlCls} w-full pl-9`}
            />
          </div>

          <select
            value={filters.call_status}
            onChange={(e) =>
              setFilters({ ...filters, call_status: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by call status"
          >
            <option value="">All Call Status</option>
            {Object.entries(callStatusMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={filters.location || ""}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by location"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={filters.language_id}
            onChange={(e) =>
              setFilters({ ...filters, language_id: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by language"
          >
            <option value="">All Languages</option>
            {[
              ...new Map(
                rows
                  .filter((r) => r.language_id)
                  .map((r) => [r.language_id, r.language_name]),
              ).entries(),
            ].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={filters.job_profile}
            onChange={(e) =>
              setFilters({ ...filters, job_profile: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by position"
          >
            <option value="">All Positions</option>
            {[...new Set(rows.map((r) => r.job_profile).filter(Boolean))].map(
              (job, i) => (
                <option key={i} value={job}>
                  {job}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.client_status}
            onChange={(e) =>
              setFilters({ ...filters, client_status: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by client status"
          >
            <option value="">All Client Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.joined}
            onChange={(e) => setFilters({ ...filters, joined: e.target.value })}
            className={controlCls}
            aria-label="Filter by joined status"
          >
            <option value="">Joined Status</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          <input
            type="date"
            value={filters.created_at}
            onChange={(e) =>
              setFilters({ ...filters, created_at: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by call date"
          />

          <button
            onClick={handleDownload}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
          >
            <Download size={15} aria-hidden="true" />
            Download Excel
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-600">
            {filteredRows.length}
          </span>{" "}
          of {rows.length} candidates
        </p>
      </div>

      {/* ── TABLE ───────────────────────────────────────────── */}
      <div className="max-h-[62vh] overflow-auto">
        <table className="w-full whitespace-nowrap text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-500">
            <tr>
              {[
                "Candidate",
                "Phone",
                "Location",
                "Address",
                "Language",
                "Job Profile",
                "Experience",
                "Salary",
                "Notice",
                "Client Code",
                "Call Status",
                "Interview Date",
                "Interview Time",
                "Call Date",
                "Call Time",
                "CV",
                "Status",
                "Joined",
                "Client Remarks",
                "HR Remarks",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-indigo-50/40"
              >
                <td className="p-3 font-semibold text-slate-900">
                  {item.candidate_name}
                </td>

                <td className="p-3 text-slate-600">{item.candidate_phone}</td>
                <td className="p-3 text-slate-600">{item.location || "-"}</td>
                <td className="p-3 text-slate-600">{item.address || "-"}</td>
                <td className="p-3 text-slate-600">
                  {item.language_name || "-"}
                </td>

                <td className="p-3 text-slate-600">
                  {item.job_profile || "-"}
                </td>

                <td className="p-3 text-slate-600">
                  {item.experience || "-"}
                </td>

                <td className="p-3 text-slate-600">
                  {item.current_ctc ? `₹${item.current_ctc}L` : "-"} →
                  {item.expected_ctc ? `₹${item.expected_ctc}L` : "-"}
                </td>

                <td className="p-3 text-slate-600">
                  {item.notice_period || "-"}
                </td>

                <td className="p-3 text-slate-600">{item.client_code}</td>

                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold
                      ${
                        Number(item.call_status_id) === 7
                          ? "bg-emerald-100 text-emerald-700"
                          : Number(item.call_status_id) === 8
                            ? "bg-rose-100 text-rose-700"
                            : Number(item.call_status_id) === 6
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {callStatusMap[item.call_status_id] || "-"}
                  </span>
                </td>

                <td className="p-3 text-slate-600">
                  {item.interview_date
                    ? new Date(item.interview_date).toLocaleDateString("en-IN")
                    : "-"}{" "}
                </td>

                <td className="p-3 text-slate-600">
                  {item.interview_time || "-"}
                </td>

                <td className="p-3 text-slate-600">
                  {new Date(item.created_at).toLocaleDateString("en-IN")}
                </td>

                <td className="p-3 text-slate-600">
                  {new Date(item.created_at).toLocaleTimeString("en-IN")}
                </td>

                <td className="p-3">
                  {item.cv_file ? (
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}${item.cv_file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                    >
                      <FileText size={13} aria-hidden="true" />
                      View CV
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold
                    ${
                      item.client_status === "accepted"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.client_status === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {Number(item.call_status_id) === 6
                      ? (item.client_status || "pending").toUpperCase()
                      : "irrelevant to client"}
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold
                    ${
                      item.joined === "Yes"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.joined || "No"}
                  </span>
                </td>

                <td className="p-3 text-slate-600">
                  {item.client_remarks || "-"}
                </td>

                <td className="p-3 text-slate-600">{item.hr_remarks || "-"}</td>

                <td className="p-3">
                  <button
                    onClick={() => onEdit?.(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                  >
                    <Pencil size={12} aria-hidden="true" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredRows.length === 0 && !loading && (
              <tr>
                <td colSpan="21" className="p-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Inbox size={22} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No interviews found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Try adjusting the filters or add a new interview.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
