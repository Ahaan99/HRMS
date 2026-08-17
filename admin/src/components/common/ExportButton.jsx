import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { exportCSV, exportExcel, exportPDF } from "../../utils/exportUtils";

/**
 * Reusable "Export data" button with CSV / Excel / PDF formats.
 * Same props API as before (data, filename, exclude, label) so all
 * existing usages automatically gain Excel + PDF export.
 *
 * @param {Array<Object>} data      Rows to export (usually the filtered list)
 * @param {string}        filename  Base file name, e.g. "employees"
 * @param {Array<string>} exclude   Keys to exclude from the export
 * @param {string}        label     Button label
 */
export default function ExportButton({
  data = [],
  filename = "export",
  exclude = [],
  label = "Export",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const disabled = !Array.isArray(data) || data.length === 0;

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const cleanRows = () => {
    if (!exclude?.length) return data;
    return data.map((row) => {
      const copy = { ...row };
      for (const k of exclude) delete copy[k];
      return copy;
    });
  };

  const run = (fn) => {
    setOpen(false);
    fn(cleanRows(), filename, null, filename.replace(/[-_]/g, " "));
  };

  const itemCls =
    "w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-left";

  return (
    <div ref={ref} className={"relative inline-block " + className}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        title={
          disabled
            ? "No data to export"
            : `Export ${data.length} row${data.length === 1 ? "" : "s"}`
        }
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#33405c] shadow-[inset_0_0_0_1px_#e6e9f0] hover:bg-[#f7f8fb] hover:text-[#0b1220] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <Download size={16} />
        {label}
        <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#e6e9f0] rounded-xl shadow-[0_8px_24px_rgba(11,18,32,0.10)] overflow-hidden z-50">
          <button type="button" className={itemCls} onClick={() => run(exportCSV)}>
            <FileDown size={15} className="text-gray-500" /> CSV
          </button>
          <button type="button" className={itemCls} onClick={() => run(exportExcel)}>
            <FileSpreadsheet size={15} className="text-emerald-600" /> Excel (.xls)
          </button>
          <button type="button" className={itemCls} onClick={() => run(exportPDF)}>
            <FileText size={15} className="text-red-500" /> PDF (print)
          </button>
        </div>
      )}
    </div>
  );
}
