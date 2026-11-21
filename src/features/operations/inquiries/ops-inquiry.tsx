"use client";

import * as React from "react";
import { InquiryFilterBar, InquiryTable, useInquiryRunner } from "@/components/cbs-inquiry-engine";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import type { InquirySort } from "@/lib/cbs-inquiry-spec";
import type { CbsScreenProps } from "@/lib/cbs-screen";
import type { FilterCriteriaMap, InquiryConfigRecord, InquiryRow } from "@/lib/data-schemas";
import { CBS_INQUIRY_STEP } from "@/types";
import { InquirySkeleton } from "./components/inquiry-skeleton";
import { useInquiryActions } from "./hooks/use-inquiry-actions";
import { useInquirySchema } from "./hooks/use-inquiry-schema";
import { useInquiryState } from "./hooks/use-inquiry-state";

/** The operator's inquiry screen (`INQ <NAME>`): loads the saved inquiry, then runs it. */
export function OpsInquiry({ command, tabId, className }: CbsScreenProps) {
  const { schema, entryName, loading, error, refetch } = useInquirySchema(command);

  if (loading) return <InquirySkeleton />;
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
    <OpsInquiryBody
      key={entryName}
      inquiryId={entryName}
      schema={schema}
      tabId={tabId}
      className={className}
    />
  );
}

interface OpsInquiryBodyProps {
  inquiryId: string;
  schema: InquiryConfigRecord;
  tabId?: string;
  className?: string;
}

function OpsInquiryBody({ inquiryId, schema, tabId, className }: OpsInquiryBodyProps) {
  const { step, setStep, criteria, setCriteria, page, setPage } = useInquiryState({
    tabId,
    schema,
  });
  const [rows, setRows] = React.useState<InquiryRow[]>([]);
  const [sort, setSort] = React.useState<InquirySort | null>(null);
  const { run, running } = useInquiryRunner(inquiryId, schema);

  /** Runs the query; `restore` keeps the page (a refresh or a restored tab), a new search starts over. */
  const search = React.useCallback(
    async (searchCriteria: FilterCriteriaMap, restore: boolean) => {
      const outcome = await run(searchCriteria);
      if (outcome.status !== "ok") return outcome.status;
      setCriteria(searchCriteria);
      setRows(outcome.result.rows);
      if (!restore) {
        setPage(1);
        setSort(null);
      }
      setStep(CBS_INQUIRY_STEP.RESULTS);
      return outcome.status;
    },
    [run, setCriteria, setPage, setStep],
  );

  // A tab saved on its results (refresh, popup, dock-back) reruns its last query once, and an
  // inquiry without filters runs straight away. Only an aborted run (a StrictMode remount) is
  // retried; after success or failure the operator drives the screen.
  const pendingRunRef = React.useRef(
    step === CBS_INQUIRY_STEP.RESULTS || schema.INQSelectField.length === 0,
  );
  React.useEffect(() => {
    if (!pendingRunRef.current) return;
    void search(criteria, true).then((status) => {
      if (status !== "aborted") pendingRunRef.current = false;
    });
  }, [search, criteria]);

  const { handleExportCSV, handleExportHTML, handleExportXML } = useInquiryActions({
    schema,
    rows,
    sort,
  });

  const info = schema.INQInfo;
  return (
    <CbsScreenScaffold
      title={info.description || inquiryId}
      commandCode={info.controllerName || inquiryId}
      variant="inquiry"
      inquiryStep={step}
      onInquiryBackToSelection={() => setStep(CBS_INQUIRY_STEP.SELECTION)}
      onInquiryRefresh={running ? undefined : () => void search(criteria, true)}
      onInquiryPrintLocal={() => window.print()}
      onInquiryExportCSV={handleExportCSV}
      onInquiryExportHTML={handleExportHTML}
      onInquiryExportXML={handleExportXML}
      className={className}
    >
      {info.pageOrientation === "Landscape" && (
        <style>{"@media print { @page { size: landscape; } }"}</style>
      )}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === CBS_INQUIRY_STEP.SELECTION ? (
          <InquiryFilterBar
            inquiryName={inquiryId}
            fields={schema.INQSelectField}
            criteria={criteria}
            onCriteriaChange={setCriteria}
            onSearch={(searchCriteria) => void search(searchCriteria, false)}
            loading={running}
          />
        ) : (
          <InquiryTable
            columns={schema.INQDef}
            rows={rows}
            commands={schema.INQCmds}
            info={info}
            page={page}
            onPageChange={setPage}
            sort={sort}
            onSortChange={setSort}
          />
        )}
      </div>
    </CbsScreenScaffold>
  );
}
