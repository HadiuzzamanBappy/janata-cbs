"use client";

import { ArrowLeft, Table } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { buildDefaultCriteria, serializeCriteriaToWire } from "@/lib/cbs-inquiry-spec";
import { logger } from "@/lib/core-logger";
import {
  type FilterCriteriaMap,
  type InquiryConfigRecord,
  type InquiryRow,
  inquiryRowListSchema,
} from "@/lib/data-schemas";
import { CBS_INQUIRY_STEP, type CbsInquiryStep } from "@/types";
import { InquiryFilterBar } from "./inquiry-filter-bar";
import { InquiryTable } from "./inquiry-table";

export interface InquiryPreviewProps {
  config: InquiryConfigRecord;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * Single, authoritative, shared inquiry preview and live simulation component.
 * Used by INQUIRY.CONFIG and custom inquiry inspectors.
 * Simulates real query dispatch while maintaining isolated preview state.
 */
export function InquiryPreview({
  config,
  emptyTitle = "No Columns or Criteria Defined",
  emptyDescription = "This inquiry has no display columns or filter criteria configured yet. Switch to the Selection Criteria or Columns & Actions tab to add fields.",
  className = "",
}: InquiryPreviewProps) {
  const hasFilters = Boolean(config.INQSelectField && config.INQSelectField.length > 0);
  const hasColumns = Boolean(config.INQDef && config.INQDef.length > 0);
  const hasConfiguration = hasFilters || hasColumns;

  const [step, setStep] = React.useState<CbsInquiryStep>(
    hasFilters ? CBS_INQUIRY_STEP.SELECTION : CBS_INQUIRY_STEP.RESULTS,
  );
  const [rows, setRows] = React.useState<InquiryRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [criteria, setCriteria] = React.useState<FilterCriteriaMap>({});

  const targetController = config.INQInfo?.controllerName?.trim() || "";

  // Initialize criteria from select fields
  React.useEffect(() => {
    setCriteria(buildDefaultCriteria(config.INQSelectField));
    setStep(hasFilters ? CBS_INQUIRY_STEP.SELECTION : CBS_INQUIRY_STEP.RESULTS);
  }, [config.INQSelectField, hasFilters]);

  // Execute live backend query simulation
  const executeQuery = React.useCallback(
    async (critMap: FilterCriteriaMap, signal?: AbortSignal) => {
      if (!targetController) {
        toast.add({
          title: "No Target Controller",
          description: "Set the Target Table / Controller on the General tab to preview.",
          type: "warning",
        });
        setRows([]);
        return;
      }
      setLoading(true);
      const branchCodeToFilter = config.INQInfo?.showBranchWise ? "1001" : null;
      const queryString = serializeCriteriaToWire(
        critMap,
        config.INQSelectField || [],
        config.INQInfo?.fixedSelection,
        branchCodeToFilter,
      );

      try {
        const queryRes = await cbs.send(
          cbs.inquiry.executeQuery(targetController, {
            servicePath: config.INQInfo?.inqServicePath,
            inqType: config.INQInfo?.inqType,
            perPage: Number(config.INQInfo?.perpageItem) || 1000,
            curPage: 1,
            queryString,
          }),
          { silent: true, signal, responseSchema: inquiryRowListSchema },
        );

        if (queryRes.status !== "SUCCESS") {
          throw new Error(queryRes.message || `Core rejected inquiry on ${targetController}`);
        }

        const dataset = queryRes.data ?? [];
        setRows(dataset);
        setStep(CBS_INQUIRY_STEP.RESULTS);
        toast.add({
          title: "Simulation Executed",
          description: `Loaded ${dataset.length} record(s)`,
          type: "info",
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        logger.warn("Inquiry simulation failed", err, "INQUIRY_PREVIEW");
        toast.add({
          title: "Simulation Query Failed",
          description: err instanceof Error ? err.message : "Backend query failed",
          type: "destructive",
        });
        setRows([]);
        setStep(CBS_INQUIRY_STEP.RESULTS);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      targetController,
      config.INQInfo?.inqServicePath,
      config.INQInfo?.inqType,
      config.INQInfo?.perpageItem,
      config.INQInfo?.fixedSelection,
      config.INQInfo?.showBranchWise,
      config.INQSelectField,
    ],
  );

  // Auto-fetch if columns exist, no selection filters exist, and on RESULTS step
  React.useEffect(() => {
    if (!hasColumns || hasFilters || step !== CBS_INQUIRY_STEP.RESULTS) return;
    const controller = new AbortController();
    executeQuery({}, controller.signal);
    return () => controller.abort();
  }, [hasColumns, hasFilters, step, executeQuery]);

  const handleFilterSearch = (searchCrit: FilterCriteriaMap) => {
    setCriteria(searchCrit);
    executeQuery(searchCrit);
  };

  const handleResetFilters = () => {
    setCriteria(buildDefaultCriteria(config.INQSelectField));
    setRows([]);
  };

  if (!hasConfiguration) {
    return (
      <div className="h-full w-full flex-1">
        <EmptyState icon={Table} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const pageSize = Number(config.INQInfo?.perpageItem || 30) || 30;

  return (
    <div className={`h-full flex flex-col min-h-0 overflow-hidden pr-1 ${className}`}>
      {step === CBS_INQUIRY_STEP.RESULTS && hasFilters && (
        <div className="shrink-0 pb-1.5 flex items-center">
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
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === CBS_INQUIRY_STEP.SELECTION ? (
          <InquiryFilterBar
            fields={config.INQSelectField || []}
            criteria={criteria}
            onCriteriaChange={setCriteria}
            onSearch={handleFilterSearch}
            onReset={handleResetFilters}
            loading={loading}
          />
        ) : (
          <InquiryTable
            columns={config.INQDef || []}
            rows={rows}
            commands={config.INQCmds || []}
            pageSize={pageSize}
            showSerial={config.INQInfo?.showSerial}
            showPagination={config.INQInfo?.showPagination}
            cmdFromInternal={config.INQInfo?.cmdFromInternal}
            cmdFieldName={config.INQInfo?.cmdFieldName}
          />
        )}
      </div>
    </div>
  );
}
