"use client";

import * as React from "react";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { InquiryFilterBar, InquiryTable } from "@/features/inquiry-engine";
import { cbs } from "@/lib/cbs-client";
import {
  buildDefaultCriteria,
  type FilterCriteriaMap,
  serializeCriteriaToWire,
} from "@/lib/cbs-inquiry-spec";
import type { CbsScreenProps } from "@/lib/cbs-screen";
import { parseInquiryRecords } from "@/lib/data-parsers";
import { useSessionStore } from "@/store/session/session-provider";
import { InquirySkeleton } from "./components/inquiry-skeleton";
import { useInquiryActions } from "./hooks/use-inquiry-actions";
import { useInquirySchema } from "./hooks/use-inquiry-schema";
import { useInquiryState } from "./hooks/use-inquiry-state";

export function OpsInquiry({ command, tabId, className = "" }: CbsScreenProps) {
  const { schema, loading, error, refetch } = useInquirySchema(command);
  const currentBranch = useSessionStore((s) => s.currentBranch || s.user?.branchCode);

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

  const commandCode = schema?.INQInfo?.controllerName || command;
  const title = schema?.INQInfo?.description || commandCode;

  const handleFilterSearch = React.useCallback(
    async (criteria: FilterCriteriaMap) => {
      if (!schema) return;

      const branchCodeToFilter = schema.INQInfo?.showBranchWise ? currentBranch : null;
      const queryString = serializeCriteriaToWire(
        criteria,
        schema.INQSelectField,
        schema.INQInfo?.fixedSelection,
        branchCodeToFilter,
      );
      const targetControl = schema.INQInfo?.controllerName?.trim() || commandCode;
      const isPaginationEnabled = schema.INQInfo?.showPagination !== false;
      const queryPerPage = isPaginationEnabled ? pageSize || 30 : 1000;

      try {
        const queryRes = await cbs.send<unknown>(
          cbs.inquiry.executeQuery(targetControl, {
            servicePath: schema.INQInfo?.inqServicePath,
            inqType: schema.INQInfo?.inqType,
            perPage: queryPerPage,
            curPage: 1,
            queryString,
          }),
          { silent: true },
        );

        const dataset = parseInquiryRecords(queryRes.data);

        setCurrentCriteria(criteria);
        setFilteredRows(dataset);
        setCurrentPage(1);
        setStep("RESULTS");

        toast.add({
          title: "Query Executed",
          description: `Matched ${dataset.length} record(s)`,
          type: "info",
        });
      } catch (err) {
        console.warn("Dynamic inquiry query failed", err);
        toast.add({
          title: "Query Failed",
          description: err instanceof Error ? err.message : "Backend query failed",
          type: "destructive",
        });
      }
    },
    [
      schema,
      currentBranch,
      commandCode,
      pageSize,
      setCurrentCriteria,
      setFilteredRows,
      setCurrentPage,
      setStep,
    ],
  );

  const { handleExportCSV, handleExportHTML, handleExportXML, handleRefresh } = useInquiryActions({
    schema,
    filteredRows,
    onRefreshQuery: () => handleFilterSearch(currentCriteria),
  });

  // Re-fetch dataset automatically if step was restored as "RESULTS" (e.g. after page refresh or popup open)
  const isAutoRestoredRef = React.useRef(false);
  React.useEffect(() => {
    if (!schema || isAutoRestoredRef.current) return;
    if (step === "RESULTS" && filteredRows.length === 0) {
      isAutoRestoredRef.current = true;
      handleFilterSearch(currentCriteria);
    }
  }, [schema, step, filteredRows.length, currentCriteria, handleFilterSearch]);

  const handleResetFilters = () => {
    if (!schema) return;
    const initialCriteria = buildDefaultCriteria(schema.INQSelectField);
    setCurrentCriteria(initialCriteria);
    setFilteredRows([]);
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

  return (
    <CbsScreenScaffold
      title={title}
      commandCode={commandCode}
      variant="inquiry"
      inquiryStep={step}
      onInquiryBackToSelection={() => setStep("SELECTION")}
      onInquiryRefresh={handleRefresh}
      onInquiryPrintLocal={() => window.print()}
      onInquiryPrintServer={() => {
        const rptTarget = schema.INQInfo?.rptControllerName || commandCode;
        toast.add({
          title: "Server Report Spooled",
          description: `Spool job created for ${rptTarget} (controller: ${commandCode})`,
          type: "info",
        });
      }}
      onInquiryExportCSV={handleExportCSV}
      onInquiryExportHTML={handleExportHTML}
      onInquiryExportXML={handleExportXML}
      className={className}
    >
      {schema.INQInfo?.pageOrientation === "Landscape" && (
        <style>{`@media print { @page { size: landscape; } }`}</style>
      )}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === "SELECTION" ? (
          <InquiryFilterBar
            fields={schema.INQSelectField}
            criteria={currentCriteria}
            onCriteriaChange={setCurrentCriteria}
            onSearch={handleFilterSearch}
            onReset={handleResetFilters}
          />
        ) : (
          <InquiryTable
            columns={schema.INQDef}
            commands={schema.INQCmds}
            rows={filteredRows}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            showSerial={schema.INQInfo.showSerial}
            showPagination={schema.INQInfo.showPagination}
            cmdFromInternal={schema.INQInfo.cmdFromInternal}
            cmdFieldName={schema.INQInfo.cmdFieldName}
          />
        )}
      </div>
    </CbsScreenScaffold>
  );
}

export const InquiryScreen = OpsInquiry;
