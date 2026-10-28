import * as React from "react";
import { toast } from "@/components/ui/toast";
import {
  type ExportColumn,
  exportToCsv,
  exportToHtmlReport,
  exportToXml,
} from "@/lib/core-utils/export";
import type { EnquiryRow, InquiryConfigRecord } from "@/lib/data-schemas";

export interface UseInquiryActionsProps {
  schema: InquiryConfigRecord | null;
  filteredRows: EnquiryRow[];
}

export function useInquiryActions({ schema, filteredRows }: UseInquiryActionsProps) {
  const getExportColumns = React.useCallback((): ExportColumn<EnquiryRow>[] => {
    if (!schema?.INQDef) return [];
    return schema.INQDef.map((col) => ({
      key: col.fieldName,
      header: col.fieldDisplay || col.fieldName,
    }));
  }, [schema]);

  const handleExportCSV = React.useCallback(() => {
    if (!schema || filteredRows.length === 0) return;
    const filename = schema.INQInfo?.controllerName || "inquiry";
    exportToCsv(filename, getExportColumns(), filteredRows);
    toast.add({
      title: "Export Completed",
      description: `Exported ${filteredRows.length} rows to CSV`,
      type: "success",
    });
  }, [schema, filteredRows, getExportColumns]);

  const handleExportHTML = React.useCallback(() => {
    if (!schema || filteredRows.length === 0) return;
    const filename = schema.INQInfo?.controllerName || "inquiry";
    const title = schema.INQInfo?.description || filename;
    exportToHtmlReport(filename, getExportColumns(), filteredRows, {
      title,
      subtitle: schema.INQInfo?.controllerName,
    });
    toast.add({
      title: "HTML Export Completed",
      description: `Saved HTML report with ${filteredRows.length} records`,
      type: "success",
    });
  }, [schema, filteredRows, getExportColumns]);

  const handleExportXML = React.useCallback(() => {
    if (!schema || filteredRows.length === 0) return;
    const filename = schema.INQInfo?.controllerName || "inquiry";
    const title = schema.INQInfo?.description || filename;
    exportToXml(filename, getExportColumns(), filteredRows, {
      title,
      code: schema.INQInfo?.controllerName,
    });
    toast.add({
      title: "XML Export Completed",
      description: `Saved XML report with ${filteredRows.length} records`,
      type: "success",
    });
  }, [schema, filteredRows, getExportColumns]);

  const handleRefresh = React.useCallback(() => {
    if (!schema) return;
    toast.add({
      title: "Refreshed",
      description: `Inquiry records refreshed for ${schema.INQInfo?.description || schema.INQInfo?.controllerName || "inquiry"}`,
      type: "info",
    });
  }, [schema]);

  return {
    handleExportCSV,
    handleExportHTML,
    handleExportXML,
    handleRefresh,
  };
}
