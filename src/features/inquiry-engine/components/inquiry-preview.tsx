"use client";

import { ArrowLeft, Table } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { type FilterCriteriaMap, serializeCriteriaToWire } from "@/lib/cbs-inquiry-spec";
import { parseInquiryRecords } from "@/lib/data-parsers";
import type { EnquiryRow, InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
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

  const [step, setStep] = React.useState<"SELECTION" | "RESULTS">(
    hasFilters ? "SELECTION" : "RESULTS",
  );
  const [rows, setRows] = React.useState<EnquiryRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [criteria, setCriteria] = React.useState<FilterCriteriaMap>({});

  const targetController = config.INQInfo?.controllerName?.trim() || "ACCOUNT";

  // Initialize criteria from select fields
  React.useEffect(() => {
    const initial: FilterCriteriaMap = {};
    for (const f of config.INQSelectField || []) {
      initial[f.selectFieldName] = {
        value: f.selectFieldValue || "",
        operand: (f.selectFieldOperator as FilterCriteriaMap[string]["operand"]) || "EQ",
      };
    }
    setCriteria(initial);
    setStep(hasFilters ? "SELECTION" : "RESULTS");
  }, [config.INQSelectField, hasFilters]);

  // Execute live backend query simulation
  const executeQuery = React.useCallback(
    async (critMap: FilterCriteriaMap, signal?: AbortSignal) => {
      setLoading(true);
      const branchCodeToFilter = config.INQInfo?.showBranchWise ? "1001" : null;
      const queryString = serializeCriteriaToWire(
        critMap,
        config.INQSelectField || [],
        config.INQInfo?.fixedSelection,
        branchCodeToFilter,
      );

      try {
        const queryRes = await cbs.send<unknown>(
          cbs.inquiry.executeQuery(targetController, {
            servicePath: config.INQInfo?.inqServicePath,
            inqType: config.INQInfo?.inqType,
            perPage: Number(config.INQInfo?.perpageItem) || 1000,
            curPage: 1,
            queryString,
          }),
          { silent: true, signal },
        );

        const dataset = parseInquiryRecords(queryRes.data);
        setRows(dataset);
        setStep("RESULTS");
        toast.add({
          title: "Simulation Executed",
          description: `Loaded ${dataset.length} record(s)`,
          type: "info",
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.warn("Inquiry simulation failed", err);
        toast.add({
          title: "Simulation Query Failed",
          description: err instanceof Error ? err.message : "Backend query failed",
          type: "destructive",
        });
        setRows([]);
        setStep("RESULTS");
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
    if (!hasColumns || hasFilters || step !== "RESULTS") return;
    const controller = new AbortController();
    executeQuery({}, controller.signal);
    return () => controller.abort();
  }, [hasColumns, hasFilters, step, executeQuery]);

  const handleFilterSearch = (searchCrit: FilterCriteriaMap) => {
    setCriteria(searchCrit);
    executeQuery(searchCrit);
  };

  const handleResetFilters = () => {
    const cleared: FilterCriteriaMap = {};
    for (const f of config.INQSelectField || []) {
      cleared[f.selectFieldName] = {
        value: "",
        operand: (f.selectFieldOperator as FilterCriteriaMap[string]["operand"]) || "EQ",
      };
    }
    setCriteria(cleared);
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
      {step === "RESULTS" && hasFilters && (
        <div className="shrink-0 pb-1.5 flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep("SELECTION")}
            className="h-6 text-xs px-2 gap-1 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-3" />
            <span>Selection Criteria</span>
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === "SELECTION" ? (
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
