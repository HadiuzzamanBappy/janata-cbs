/**
 * Client Table CSV Export Utility
 */

export interface ExportCsvColumn<T> {
  key: keyof T | string;
  header: string;
}

export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  columns: ExportCsvColumn<T>[],
  rows: T[],
): void {
  if (typeof window === "undefined") return;

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
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
