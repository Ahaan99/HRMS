import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, FileText } from "lucide-react";
import API from "../../services/api";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/api\/?$/,
  "",
);

export default function ClientSOPLibrary() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dept, setDept] = useState("");

  useEffect(() => {
    API.get("/sops/client-library")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Failed to load SOP library"))
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.department))].sort(),
    [rows],
  );

  const filtered = dept ? rows.filter((r) => r.department === dept) : rows;

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (sop, format = "pdf") => {
    if (!sop.file_url) return;
    setDownloadingId(sop.id + "-" + format);
    try {
      const fileUrl =
        format === "docx"
          ? sop.file_url.replace(/\.pdf$/i, ".docx")
          : sop.file_url;
      const fileName =
        format === "docx"
          ? (sop.file_name || sop.title + ".pdf").replace(/\.pdf$/i, ".docx")
          : sop.file_name || sop.title.replace(/[^a-z0-9]+/gi, "-") + ".pdf";
      const res = await fetch(API_ORIGIN + fileUrl);
      if (!res.ok) throw new Error("File not found");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed. Please try again.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  const grouped = useMemo(() => {
    const g = {};
    for (const r of filtered) {
      (g[r.department] = g[r.department] || []).push(r);
    }
    return g;
  }, [filtered]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={26} />
            SOP Library
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sample editable SOP formats for your HR team. Download and adapt
            them to your organisation.
          </p>
        </div>

        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">
          Loading library...
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-500">
          No sample SOP formats published yet.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([department, sops]) => (
            <section key={department}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {department}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sops.map((sop) => (
                  <div
                    key={sop.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileText className="text-indigo-600" size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 leading-snug">
                          {sop.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          v{sop.current_version} ·{" "}
                          {new Date(sop.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {sop.description && (
                      <p className="text-xs text-gray-500 line-clamp-3">
                        {sop.description}
                      </p>
                    )}

                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => handleDownload(sop, "pdf")}
                        disabled={
                          !sop.file_url || downloadingId === sop.id + "-pdf"
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40"
                      >
                        <Download size={13} />
                        {downloadingId === sop.id + "-pdf"
                          ? "Downloading..."
                          : "PDF"}
                      </button>
                      <button
                        onClick={() => handleDownload(sop, "docx")}
                        disabled={
                          !sop.file_url || downloadingId === sop.id + "-docx"
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                      >
                        <FileText size={13} />
                        {downloadingId === sop.id + "-docx"
                          ? "Downloading..."
                          : "Word (editable)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
