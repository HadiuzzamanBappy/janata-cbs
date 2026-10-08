"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type { EnquiryRow, SelectionOperand } from "@/lib/schemas";
import { useInquirySchema } from "./hooks/use-inquiry-schema";
import { useInquiryState } from "./hooks/use-inquiry-state";
import { exportToCSV, exportToHTML, exportToXML } from "@/lib/utils/export";
import { filterDatasetByCriteria } from "./utils/filter-dataset";
import { resolveDrillDownFormCommand } from "./utils/resolve-form-command";
import { type DrillRecord, InquiryDrillDown } from "./components/inquiry-drill-down";
import { InquiryFilters } from "./components/inquiry-filters";
import { CbsInquiryHeader as InquiryHeader } from "@/lib/cbs-screen";
import { InquirySkeleton } from "./components/inquiry-skeleton";
import { InquiryTable } from "./components/inquiry-table";

export interface InquiryScreenProps {
  command: string;
  tabId?: string;
  className?: string;
}

export function OpsInquiry({ command, tabId, className = "" }: InquiryScreenProps) {
  const { schema, loading, error, refetch } = useInquirySchema(command);
  const [drillRecord, setDrillRecord] = React.useState<DrillRecord | null>(null);

  const {
    step,
    setStep,
    filteredRows,
    setFilteredRows,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentCriteria,
    setCurrentCriteria,
  } = useInquiryState({ tabId, schema });

  const handleFilterSearch = async (
    criteria: Record<string, { value: string; operand: SelectionOperand }>,
  ) => {
    if (!schema) return;

    try {
      const queryString = Object.entries(criteria)
        .filter(([_, filter]) => Boolean(filter.value?.trim()))
        .map(([fieldId, filter]) => {
          const fieldDef = schema.selectionFields.find((f) => f.id === fieldId);
          return {
            selectFieldName: fieldId,
            selectFieldType: fieldDef?.type || "text",
            selectFieldOperator: filter.operand,
            selectFieldValue: filter.value.trim(),
          };
        });

      const json = await cbs.send<EnquiryRow[]>(
        cbs.inquiry.executeQuery(schema.controllerName || schema.code, {
          queryString,
          curPage: currentPage,
          perPage: pageSize || 1000,
        }),
        { silent: true },
      );

      const dataset =
        json.status === "SUCCESS" && Array.isArray(json.data) && json.data.length > 0
          ? (json.data as EnquiryRow[])
          : [...(schema.sampleData || [])];

      const result = filterDatasetByCriteria(dataset, criteria);
      setFilteredRows(result);
      setCurrentPage(1);
      setStep("RESULTS");
      toast.add({
        title: "Inquiry Executed",
        description: `Found ${result.length} matching record(s) for ${schema.code}`,
        type: "info",
      });
    } catch {
      const result = filterDatasetByCriteria(schema.sampleData || [], criteria);
      setFilteredRows(result);
      setCurrentPage(1);
      setStep("RESULTS");
    }
  };

  const handleResetFilters = () => {
    if (!schema) return;
    const cleared: Record<string, { value: string; operand: SelectionOperand }> = {};
    for (const f of schema.selectionFields) {
      cleared[f.id] = { value: "", operand: f.operand };
    }
    setCurrentCriteria(cleared);
    setFilteredRows(schema.sampleData || []);
    setCurrentPage(1);
  };

  const handleViewRecord = (recordId: string, row: EnquiryRow) => {
    if (!schema) return;
    const targetCmd = resolveDrillDownFormCommand(schema, recordId);
    setDrillRecord({
      formCommand: targetCmd,
      recordId,
      screenMode: "VIEW",
      formData: row as Record<string, unknown>,
    });
    toast.add({
      title: "Viewing Record",
      description: `Opened record #${recordId} in ${targetCmd} (View mode)`,
      type: "info",
    });
  };

  const handleEditRecord = (recordId: string, row: EnquiryRow) => {
    if (!schema) return;
    const targetCmd = resolveDrillDownFormCommand(schema, recordId);
    setDrillRecord({
      formCommand: targetCmd,
      recordId,
      screenMode: "EDIT",
      formData: row as Record<string, unknown>,
    });
    toast.add({
      title: "Editing Record",
      description: `Opened record #${recordId} in ${targetCmd} (Edit mode)`,
      type: "info",
    });
  };

  const handleExportCSV = () => {
    if (!schema || filteredRows.length === 0) return;
    exportToCSV(filteredRows, schema.columns, schema.code);
    toast.add({
      title: "Export Completed",
      description: `Exported ${filteredRows.length} rows to CSV`,
      type: "success",
    });
  };

  const handleExportHTML = () => {
    if (!schema || filteredRows.length === 0) return;
    exportToHTML(filteredRows, schema.columns, schema.code, schema.title);
    toast.add({
      title: "HTML Export Completed",
      description: `Saved HTML report with ${filteredRows.length} records`,
      type: "success",
    });
  };

  const handleExportXML = () => {
    if (!schema || filteredRows.length === 0) return;
    exportToXML(filteredRows, schema.columns, schema.code, schema.title);
    toast.add({
      title: "XML Export Completed",
      description: `Exported ${filteredRows.length} records to XML`,
      type: "success",
    });
  };

  if (loading) return <InquirySkeleton />;

  if (error || !schema) {
    return (
      <div className="p-6 max-w-md mx-auto my-8">
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-sm">
          <p className="font-semibold text-destructive mb-1">Failed to Load Enquiry Schema</p>
          <p className="text-muted-foreground mb-3">{error || "Unknown error"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const startRecord = filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(startRecord + pageSize - 1, filteredRows.length);
  const pageRangeStr = filteredRows.length > 0 ? `${startRecord} - ${endRecord}` : "0";

  // Drill-down presentation
  if (drillRecord) {
    return (
      <InquiryDrillDown
        drillRecord={drillRecord}
        schemaTitle={schema.title}
        onReturn={() => setDrillRecord(null)}
        className={className}
      />
    );
  }

  return (
    <div className={`flex flex-col h-full w-full bg-background ${className}`}>
      {step === "RESULTS" && (
        <InquiryHeader
          title={schema.title}
          commandCode={schema.code}
          step={step}
          rowCount={filteredRows.length}
          totalCount={filteredRows.length}
          pageRange={pageRangeStr}
          onBackToSelection={() => setStep("SELECTION")}
          onRefresh={() => {
            setFilteredRows([...(schema.sampleData || [])]);
            toast.add({
              title: "Data Refreshed",
              description: `Refreshed inquiry records for ${schema.code}`,
              type: "info",
            });
          }}
          onPrintLocal={() => window.print()}
          onPrintServer={() =>
            toast.add({
              title: "Server Print Spooled",
              description: `Report spooled for ${schema.code}`,
              type: "info",
            })
          }
          onExportCSV={handleExportCSV}
          onExportHTML={handleExportHTML}
          onExportXML={handleExportXML}
        />
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2">
        {step === "SELECTION" ? (
          <InquiryFilters
            fields={schema.selectionFields}
            criteria={currentCriteria}
            onCriteriaChange={setCurrentCriteria}
            onSearch={handleFilterSearch}
            onReset={handleResetFilters}
          />
        ) : (
          <InquiryTable
            columns={schema.columns}
            rows={filteredRows}
            onViewRecord={handleViewRecord}
            onEditRecord={handleEditRecord}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

export const InquiryScreen = OpsInquiry;
