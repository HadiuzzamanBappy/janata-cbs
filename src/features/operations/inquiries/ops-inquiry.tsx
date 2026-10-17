"use client";

import * as React from "react";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { InquiryEngineTable, InquiryFilterBuilder } from "@/features/inquiry-engine";
import { type DrillRecord, InquiryDrillDown } from "./components/inquiry-drill-down";
import { InquirySkeleton } from "./components/inquiry-skeleton";
import { useInquiryActions, useInquirySchema, useInquiryState } from "./hooks";
import type { InquiryScreenProps } from "./types";
import { filterDatasetByCriteria } from "./utils/filter-dataset";

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
  } = useInquiryState({ schema, tabId });

  const {
    handleViewRecord,
    handleEditRecord,
    handleExportCSV,
    handleExportHTML,
    handleExportXML,
    handleRefresh,
  } = useInquiryActions({
    schema,
    filteredRows,
    setFilteredRows,
    setDrillRecord,
  });

  const handleFilterSearch = (criteria: typeof currentCriteria) => {
    if (!schema) return;
    const initialDataset = schema.sampleData || [];
    const results = filterDatasetByCriteria(initialDataset, criteria);

    setCurrentCriteria(criteria);
    setFilteredRows(results);
    setCurrentPage(1);
    setStep("RESULTS");

    toast.add({
      title: "Query Executed",
      description: `Matched ${results.length} records`,
      type: "info",
    });
  };

  const handleResetFilters = () => {
    if (!schema) return;
    const initialCriteria: typeof currentCriteria = {};
    for (const f of schema.selectionFields) {
      initialCriteria[f.id] = { value: "", operand: f.operand };
    }
    setCurrentCriteria(initialCriteria);
    setFilteredRows(schema.sampleData || []);
    setCurrentPage(1);
  };

  if (loading) {
    return <InquirySkeleton />;
  }

  if (error || !schema) {
    return (
      <CbsErrorState
        title="Failed to Load Command Schema"
        message={error || `No schema found for "${command}"`}
        command={command}
        onRetry={refetch}
        className={className}
      />
    );
  }

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
    <CbsScreenScaffold
      title={schema.title}
      commandCode={schema.code}
      variant="inquiry"
      inquiryStep={step}
      onInquiryBackToSelection={() => setStep("SELECTION")}
      onInquiryRefresh={handleRefresh}
      onInquiryPrintLocal={() => window.print()}
      onInquiryPrintServer={() =>
        toast.add({
          title: "Server Print Spooled",
          description: `Report spooled for ${schema.code}`,
          type: "info",
        })
      }
      onInquiryExportCSV={handleExportCSV}
      onInquiryExportHTML={handleExportHTML}
      onInquiryExportXML={handleExportXML}
      className={className}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === "SELECTION" ? (
          <InquiryFilterBuilder
            fields={schema.selectionFields}
            criteria={currentCriteria}
            onCriteriaChange={setCurrentCriteria}
            onSearch={handleFilterSearch}
            onReset={handleResetFilters}
          />
        ) : (
          <InquiryEngineTable
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
    </CbsScreenScaffold>
  );
}

export const InquiryScreen = OpsInquiry;
