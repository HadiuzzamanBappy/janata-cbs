import * as React from "react";
import { toast } from "@/components/ui/toast";
import { exportToCSV, exportToHTML, exportToXML } from "@/lib/core-utils/export";
import type { EnquiryRow, EnquirySchema } from "@/lib/data-schemas";
import type { DrillRecord } from "../components/inquiry-drill-down";
import { resolveDrillDownFormCommand } from "../utils/resolve-form-command";

export interface UseInquiryActionsProps {
  schema: EnquirySchema | null;
  filteredRows: EnquiryRow[];
  setFilteredRows: (rows: EnquiryRow[]) => void;
  setDrillRecord: (record: DrillRecord | null) => void;
}

export function useInquiryActions({
  schema,
  filteredRows,
  setFilteredRows,
  setDrillRecord,
}: UseInquiryActionsProps) {
  const handleViewRecord = React.useCallback(
    (recordId: string, row: EnquiryRow) => {
      if (!schema) return;
      const targetCmd = resolveDrillDownFormCommand(schema, recordId);
      setDrillRecord({
        formCommand: targetCmd,
        recordId,
        screenMode: "S",
        formData: row as Record<string, unknown>,
      });
      toast.add({
        title: "Viewing Record",
        description: `Opened record #${recordId} in ${targetCmd} (See mode)`,
        type: "info",
      });
    },
    [schema, setDrillRecord],
  );

  const handleEditRecord = React.useCallback(
    (recordId: string, row: EnquiryRow) => {
      if (!schema) return;
      const targetCmd = resolveDrillDownFormCommand(schema, recordId);
      setDrillRecord({
        formCommand: targetCmd,
        recordId,
        screenMode: "I",
        formData: row as Record<string, unknown>,
      });
      toast.add({
        title: "Editing Record",
        description: `Opened record #${recordId} in ${targetCmd} (Input mode)`,
        type: "info",
      });
    },
    [schema, setDrillRecord],
  );

  const handleExportCSV = React.useCallback(() => {
    if (!schema || filteredRows.length === 0) return;
    exportToCSV(filteredRows, schema.columns, schema.code);
    toast.add({
      title: "Export Completed",
      description: `Exported ${filteredRows.length} rows to CSV`,
      type: "success",
    });
  }, [schema, filteredRows]);

  const handleExportHTML = React.useCallback(() => {
    if (!schema || filteredRows.length === 0) return;
    exportToHTML(filteredRows, schema.columns, schema.code, schema.title);
    toast.add({
      title: "HTML Export Completed",
      description: `Saved HTML report with ${filteredRows.length} records`,
      type: "success",
    });
  }, [schema, filteredRows]);

  const handleExportXML = React.useCallback(() => {
    if (!schema || filteredRows.length === 0) return;
    exportToXML(filteredRows, schema.columns, schema.code, schema.title);
    toast.add({
      title: "XML Export Completed",
      description: `Saved XML report with ${filteredRows.length} records`,
      type: "success",
    });
  }, [schema, filteredRows]);

  const handleRefresh = React.useCallback(() => {
    if (!schema) return;
    setFilteredRows([...(schema.sampleData || [])]);
    toast.add({
      title: "Data Refreshed",
      description: `Refreshed inquiry records for ${schema.code}`,
      type: "info",
    });
  }, [schema, setFilteredRows]);

  return {
    handleViewRecord,
    handleEditRecord,
    handleExportCSV,
    handleExportHTML,
    handleExportXML,
    handleRefresh,
  };
}
