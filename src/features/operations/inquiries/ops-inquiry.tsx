"use client";

import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import {
  type FilterCriteriaMap,
  InquiryFilterBar,
  InquiryTable,
  type SelectionOperand,
  serializeCriteriaToWire,
} from "@/features/inquiry-engine";
import { cbs } from "@/lib/cbs-client";
import type { CbsScreenProps } from "@/lib/cbs-screen";
import { parseInquiryRecords } from "@/lib/data-parsers";
import { InquirySkeleton } from "./components/inquiry-skeleton";
import { useInquiryActions } from "./hooks/use-inquiry-actions";
import { useInquirySchema } from "./hooks/use-inquiry-schema";
import { useInquiryState } from "./hooks/use-inquiry-state";

export function OpsInquiry({ command, tabId, className = "" }: CbsScreenProps) {
  const { schema, loading, error, refetch } = useInquirySchema(command);

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

  const { handleExportCSV, handleExportHTML, handleExportXML, handleRefresh } = useInquiryActions({
    schema,
    filteredRows,
  });

  const commandCode = schema?.INQInfo?.controllerName || command;
  const title = schema?.INQInfo?.description || commandCode;

  const handleFilterSearch = async (criteria: FilterCriteriaMap) => {
    if (!schema) return;

    const queryString = serializeCriteriaToWire(criteria, schema.INQSelectField);
    const targetControl = schema.INQInfo?.controllerName?.trim() || commandCode;

    try {
      const queryRes = await cbs.send<unknown>(
        cbs.inquiry.executeQuery(targetControl, {
          servicePath: schema.INQInfo?.inqServicePath,
          perPage: pageSize || 1000,
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
  };

  const handleResetFilters = () => {
    if (!schema) return;
    const initialCriteria: FilterCriteriaMap = {};
    for (const f of schema.INQSelectField || []) {
      initialCriteria[f.selectFieldName] = {
        value: f.selectFieldValue || "",
        operand: (f.selectFieldOperator || "EQ") as SelectionOperand,
      };
    }
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
      onInquiryPrintServer={() =>
        toast.add({
          title: "Server Print Spooled",
          description: `Report spooled for ${commandCode}`,
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
          />
        )}
      </div>
    </CbsScreenScaffold>
  );
}

export const InquiryScreen = OpsInquiry;
