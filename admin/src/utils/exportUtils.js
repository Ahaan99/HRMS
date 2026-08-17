/**
 * Universal export utilities: CSV, Excel (.xls), and PDF (print dialog).
 * rows: array of objects; columns: [{ key, label }] (optional - derived from first row).
 */

const deriveColumns = (rows, columns) =>
  columns ||
  Object.keys(rows[0] || {}).map((k) => ({
    key: k,
    label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

const cellValue = (row, key) => {
  const v = row[key];
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const exportCSV = (rows, filename = "export", columns = null) => {
  if (!rows?.length) return alert("Nothing to export");
  const cols = deriveColumns(rows, columns);
  const esc = (s) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    cols.map((c) => esc(c.label)).join(","),
    ...rows.map((r) => cols.map((c) => esc(cellValue(r, c.key))).join(",")),
  ];
  download(
    new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    `${filename}.csv`,
  );
};

export const exportExcel = (rows, filename = "export", columns = null) => {
  if (!rows?.length) return alert("Nothing to export");
  const cols = deriveColumns(rows, columns);
  const escHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const table = `<table><thead><tr>${cols
    .map((c) => `<th>${escHtml(c.label)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (r) =>
        `<tr>${cols.map((c) => `<td>${escHtml(cellValue(r, c.key))}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body>${table}</body></html>`;
  download(
    new Blob([html], { type: "application/vnd.ms-excel" }),
    `${filename}.xls`,
  );
};

export const exportPDF = (rows, filename = "export", columns = null, title = "") => {
  if (!rows?.length) return alert("Nothing to export");
  const cols = deriveColumns(rows, columns);
  const escHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const w = window.open("", "_blank");
  if (!w) return alert("Popup blocked. Allow popups to export PDF.");
  w.document.write(`<!DOCTYPE html><html><head><title>${escHtml(filename)}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      p.meta { font-size: 11px; color: #777; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f4f4f4; }
      tr:nth-child(even) td { background: #fafafa; }
      @media print { @page { margin: 12mm; } }
    </style></head><body>
    <h1>${escHtml(title || filename)}</h1>
    <p class="meta">Generated ${new Date().toLocaleString()} &middot; ${rows.length} records</p>
    <table><thead><tr>${cols.map((c) => `<th>${escHtml(c.label)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map(
        (r) =>
          `<tr>${cols.map((c) => `<td>${escHtml(cellValue(r, c.key))}</td>`).join("")}</tr>`,
      )
      .join("")}</tbody></table>
    </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
};
