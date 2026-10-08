import type { EnquiryColumn, EnquiryRow } from "@/lib/schemas";

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports inquiry records to CSV format.
 */
export function exportToCSV(rows: EnquiryRow[], columns: EnquiryColumn[], code: string): void {
  if (rows.length === 0) return;

  const headers = columns.map((c) => c.label).join(",");
  const rowsCSV = rows
    .map((row) => columns.map((c) => `"${row[c.id] ?? ""}"`).join(","))
    .join("\n");

  const blob = new Blob([`${headers}\n${rowsCSV}`], {
    type: "text/csv;charset=utf-8;",
  });
  triggerBrowserDownload(blob, `${code.replace(/\s+/g, "_")}.csv`);
}

/**
 * Exports inquiry records to a standalone HTML table report.
 */
export function exportToHTML(
  rows: EnquiryRow[],
  columns: EnquiryColumn[],
  code: string,
  title: string,
): void {
  if (rows.length === 0) return;

  const tableHeaders = columns.map((c) => `<th>${c.label}</th>`).join("");
  const tableBody = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${r[c.id] ?? ""}</td>`).join("")}</tr>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h2>${title} (${code})</h2><table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableBody}</tbody></table></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  triggerBrowserDownload(blob, `${code.replace(/\s+/g, "_")}.html`);
}

/**
 * Exports inquiry records to XML structure.
 */
export function exportToXML(
  rows: EnquiryRow[],
  columns: EnquiryColumn[],
  code: string,
  title: string,
): void {
  if (rows.length === 0) return;

  const xmlRows = rows
    .map((r) => {
      const fields = columns.map((c) => `    <${c.id}>${r[c.id] ?? ""}</${c.id}>`).join("\n");
      return `  <record>\n${fields}\n  </record>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<enquiry name="${code}" title="${title}">\n${xmlRows}\n</enquiry>`;
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
  triggerBrowserDownload(blob, `${code.replace(/\s+/g, "_")}.xml`);
}
