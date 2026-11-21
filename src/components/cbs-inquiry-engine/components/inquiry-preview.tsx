"use client";

import { ArrowLeft, Info, Table } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { buildDefaultCriteria, type InquirySort } from "@/lib/cbs-inquiry-spec";
import type { FilterCriteriaMap, InquiryConfigRecord, InquiryRow } from "@/lib/data-schemas";
import { CBS_INQUIRY_STEP, type CbsInquiryStep } from "@/types";
import { useInquiryRunner } from "../hooks/use-inquiry-runner";
import { InquiryFilterBar } from "./inquiry-filter-bar";
import { InquiryTable } from "./inquiry-table";

export interface InquiryPreviewProps {
  /** The INQUIRY record ID whose saved definition the preview runs. */
  inquiryId: string;
  /** The designer's draft: its filters, columns and actions shape the preview. */
  config: InquiryConfigRecord;
  /** True when the draft isn't the live definition (unsaved or not yet authorized). */
  draftDiffers: boolean;
}

/**
 * Live preview inside the Inquiry Designer. The layout (filters, columns, row actions) follows the
 * draft, but the query is the saved, live inquiry `inquiryId` as `/api/proxy` resolves it: a draft
 * can't choose a table, fixed selection or branch scope, so the preview never shows data the
 * saved inquiry wouldn't.
 */
export function InquiryPreview({ inquiryId, config, draftDiffers }: InquiryPreviewProps) {
  const fields = config.INQSelectField;
  const [step, setStep] = React.useState<CbsInquiryStep>(CBS_INQUIRY_STEP.SELECTION);
  const [criteria, setCriteria] = React.useState<FilterCriteriaMap>(() =>
    buildDefaultCriteria(fields),
  );
  const [rows, setRows] = React.useState<InquiryRow[]>([]);
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<InquirySort | null>(null);
  const { run, running } = useInquiryRunner(inquiryId, config);

  // A changed filter set restarts the criteria from its defaults
  React.useEffect(() => {
    setCriteria(buildDefaultCriteria(fields));
    setStep(CBS_INQUIRY_STEP.SELECTION);
  }, [fields]);

  const handleSearch = async (searchCriteria: FilterCriteriaMap) => {
    const outcome = await run(searchCriteria);
    if (outcome.status !== "ok") return;
    setRows(outcome.result.rows);
    setPage(1);
    setSort(null);
    setStep(CBS_INQUIRY_STEP.RESULTS);
  };

  if (config.INQDef.length === 0 && fields.length === 0) {
    return (
      <div className="h-full w-full flex-1">
        <EmptyState
          icon={Table}
          title="No Columns or Criteria Defined"
          description="This inquiry has no display columns or filter criteria configured yet. Switch to the Filters or Columns tab to add fields."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden pr-1 gap-1.5">
      <div className="shrink-0 flex items-center gap-2 min-h-6">
        {step === CBS_INQUIRY_STEP.RESULTS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep(CBS_INQUIRY_STEP.SELECTION)}
            className="h-6 text-xs px-2 gap-1 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-3" />
            <span>Selection Criteria</span>
          </Button>
        )}
        {(draftDiffers || !inquiryId) && (
          <p className="flex items-center gap-1 text-2xs text-muted-foreground">
            <Info className="size-3 shrink-0" />
            {inquiryId
              ? `Runs the live definition of ${inquiryId}. Save and authorize to preview changes to the target, fixed selection or filters.`
              : "Enter the inquiry ID to run a live preview."}
          </p>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === CBS_INQUIRY_STEP.SELECTION ? (
          <InquiryFilterBar
            inquiryName={config.INQInfo.description || inquiryId}
            fields={fields}
            criteria={criteria}
            onCriteriaChange={setCriteria}
            onSearch={handleSearch}
            loading={running || !inquiryId}
          />
        ) : (
          <InquiryTable
            columns={config.INQDef}
            rows={rows}
            commands={config.INQCmds}
            info={config.INQInfo}
            page={page}
            onPageChange={setPage}
            sort={sort}
            onSortChange={setSort}
          />
        )}
      </div>
    </div>
  );
}
