/**
 * Client Table & Document Export Utilities (CSV, HTML, XML)
 */

export interface ExportColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
}

export type ExportCsvColumn<T> = ExportColumn<T>;

function triggerBrowserDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
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
 * Universal CSV Export with UTF-8 BOM for Excel compatibility.
 */
export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
): void {
  if (typeof window === "undefined" || rows.length === 0) return;

  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");

  const bodyRows = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key as keyof T];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  const csvContent = `\uFEFF${[headerRow, ...bodyRows].join("\r\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/**
 * Exports data records to a standalone styled HTML report table.
 */
export function exportToHtmlReport<T extends Record<string, unknown>>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  options?: { title?: string; subtitle?: string },
): void {
  if (typeof window === "undefined" || rows.length === 0) return;

  const title = options?.title || filename;
  const subtitle = options?.subtitle ? ` (${options.subtitle})` : "";
  const tableHeaders = columns.map((c) => `<th>${c.header}</th>`).join("");
  const tableBody = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${r[c.key as keyof T] ?? ""}</td>`).join("")}</tr>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h2>${title}${subtitle}</h2><table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableBody}</tbody></table></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  triggerBrowserDownload(blob, filename.endsWith(".html") ? filename : `${filename}.html`);
}

/**
 * Exports data records to a formatted XML structure.
 */
export function exportToXml<T extends Record<string, unknown>>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  options?: { rootTag?: string; recordTag?: string; code?: string; title?: string },
): void {
  if (typeof window === "undefined" || rows.length === 0) return;

  const rootTag = options?.rootTag || "dataset";
  const recordTag = options?.recordTag || "record";
  const codeAttr = options?.code ? ` code="${options.code}"` : "";
  const titleAttr = options?.title ? ` title="${options.title}"` : "";

  const xmlRows = rows
    .map((r) => {
      const fields = columns
        .map((c) => {
          const raw = r[c.key as keyof T] ?? "";
          const escaped = String(raw)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `    <${String(c.key)}>${escaped}</${String(c.key)}>`;
        })
        .join("\n");
      return `  <${recordTag}>\n${fields}\n  </${recordTag}>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}${codeAttr}${titleAttr}>\n${xmlRows}\n</${rootTag}>`;
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
  triggerBrowserDownload(blob, filename.endsWith(".xml") ? filename : `${filename}.xml`);
}

/**
 * Compatibility wrapper for operations enquiry schema
 */
export function exportToCSV(
  rows: Record<string, unknown>[],
  columns: Array<{ id: string; label: string }>,
  code: string,
): void {
  exportToCsv(
    code.replace(/\s+/g, "_"),
    columns.map((c) => ({ key: c.id, header: c.label })),
    rows,
  );
}

/**
 * Compatibility wrapper for operations enquiry schema
 */
export function exportToHTML(
  rows: Record<string, unknown>[],
  columns: Array<{ id: string; label: string }>,
  code: string,
  title: string,
): void {
  exportToHtmlReport(
    code.replace(/\s+/g, "_"),
    columns.map((c) => ({ key: c.id, header: c.label })),
    rows,
    { title, subtitle: code },
  );
}

/**
 * Compatibility wrapper for operations enquiry schema
 */
export function exportToXML(
  rows: Record<string, unknown>[],
  columns: Array<{ id: string; label: string }>,
  code: string,
  title: string,
): void {
  exportToXml(
    code.replace(/\s+/g, "_"),
    columns.map((c) => ({ key: c.id, header: c.label })),
    rows,
    { rootTag: "enquiry", recordTag: "record", code, title },
  );
}
