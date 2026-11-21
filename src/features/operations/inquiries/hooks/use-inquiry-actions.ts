import * as React from "react";
import { toast } from "@/components/ui/toast";
import { deriveInquiryColumnMeta, type InquirySort, sortInquiryRows } from "@/lib/cbs-inquiry-spec";
import { type ExportColumn, exportToCsv, exportToHtmlReport, exportToXml } from "@/lib/core-utils";
import type { InquiryConfigRecord, InquiryRow } from "@/lib/data-schemas";

export interface UseInquiryActionsProps {
  schema: InquiryConfigRecord;
  rows: readonly InquiryRow[];
  sort: InquirySort | null;
}

function done(title: string, description: string) {
  toast.add({ title, description, type: "success" });
}

/** CSV, HTML and XML exports of the result, in the order the table shows it. */
export function useInquiryActions({ schema, rows, sort }: UseInquiryActionsProps) {
  const exportData = React.useCallback(() => {
    const metas = schema.INQDef.map(deriveInquiryColumnMeta);
    const columns: ExportColumn<InquiryRow>[] = metas.map((col) => ({
      key: col.id,
      header: col.label,
    }));
    const name = schema.INQInfo.controllerName || "inquiry";
    const title = schema.INQInfo.description || name;
    return { columns, rows: sortInquiryRows(rows, sort, metas), name, title };
  }, [schema, rows, sort]);

  const handleExportCSV = React.useCallback(() => {
    if (rows.length === 0) return;
    const { columns, rows: ordered, name } = exportData();
    exportToCsv(name, columns, ordered);
    done("Export Completed", `Exported ${ordered.length} rows to CSV`);
  }, [rows.length, exportData]);

  const handleExportHTML = React.useCallback(() => {
    if (rows.length === 0) return;
    const { columns, rows: ordered, name, title } = exportData();
    exportToHtmlReport(name, columns, ordered, { title, subtitle: name });
    done("HTML Export Completed", `Saved HTML report with ${ordered.length} records`);
  }, [rows.length, exportData]);

  const handleExportXML = React.useCallback(() => {
    if (rows.length === 0) return;
    const { columns, rows: ordered, name, title } = exportData();
    exportToXml(name, columns, ordered, { title, code: name });
    done("XML Export Completed", `Saved XML report with ${ordered.length} records`);
  }, [rows.length, exportData]);

  return { handleExportCSV, handleExportHTML, handleExportXML };
}
