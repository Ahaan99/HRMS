// Shared CSV export utility (Excel-compatible, UTF-8 BOM)

const formatCell = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      value = JSON.stringify(value);
    } catch {
      value = String(value);
    }
  }
  const str = String(value).replace(/"/g, '""');
  return /[",\n\r]/.test(str) ? `"${str}"` : str;
};

/**
 * Export an array of plain objects to a downloadable CSV file.
 * Column headers are derived from the union of keys across all rows.
 *
 * @param {Array<Object>} rows      Data rows
 * @param {string}        filename  File name without extension
 * @param {Array<string>} [exclude] Keys to skip (ids, tokens, etc.)
 */
export const exportToCSV = (rows, filename = "export", exclude = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return false;

  const skip = new Set(
    exclude.concat(["password", "token", "__typename"])
  );

  const headers = [];
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!skip.has(key) && !headers.includes(key)) headers.push(key);
    });
  });

  const lines = [
    headers.map(formatCell).join(","),
    ...rows.map((row) =>
      headers.map((h) => formatCell(row?.[h])).join(",")
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
