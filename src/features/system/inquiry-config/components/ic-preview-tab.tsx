"use client";

import { ArrowLeft } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  type FilterCriteriaMap,
  InquiryFilterBar,
  InquiryTable,
  serializeCriteriaToWire,
} from "@/features/inquiry-engine";
import { cbs } from "@/lib/cbs-client";
import { parseInquiryRecords } from "@/lib/data-parsers";
import type { EnquiryRow, InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcPreviewTabProps {
  formData: InquiryConfigRecord;
}

export function IcPreviewTab({ formData }: IcPreviewTabProps) {
  const hasFilters = Boolean(formData.INQSelectField && formData.INQSelectField.length > 0);
  const [step, setStep] = React.useState<"SELECTION" | "RESULTS">(
    hasFilters ? "SELECTION" : "RESULTS",
  );
  const [rows, setRows] = React.useState<EnquiryRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [criteria, setCriteria] = React.useState<FilterCriteriaMap>({});

  const targetController = formData.INQInfo?.controllerName?.trim() || "ACCOUNT";

  // Initialize criteria from select fields
  React.useEffect(() => {
    const initial: FilterCriteriaMap = {};
    for (const f of formData.INQSelectField || []) {
      initial[f.selectFieldName] = {
        value: f.selectFieldValue || "",
        operand: (f.selectFieldOperator as FilterCriteriaMap[string]["operand"]) || "EQ",
      };
    }
    setCriteria(initial);
    setStep(hasFilters ? "SELECTION" : "RESULTS");
  }, [formData.INQSelectField, hasFilters]);

  // Execute real backend query simulation
  const executeQuery = React.useCallback(
    async (critMap: FilterCriteriaMap) => {
      setLoading(true);
      const queryString = serializeCriteriaToWire(critMap, formData.INQSelectField || []);

      try {
        const queryRes = await cbs.send<unknown>(
          cbs.inquiry.executeQuery(targetController, {
            servicePath: formData.INQInfo?.inqServicePath,
            perPage: Number(formData.INQInfo?.perpageItem) || 1000,
            curPage: 1,
            queryString,
          }),
          { silent: true },
        );

        const dataset = parseInquiryRecords(queryRes.data);
        setRows(dataset);
        setStep("RESULTS");
      } catch (err) {
        console.warn("Inquiry simulation failed", err);
        toast.add({
          title: "Query Failed",
          description: err instanceof Error ? err.message : "Target controller query failed",
          type: "destructive",
        });
        setRows([]);
        setStep("RESULTS");
      } finally {
        setLoading(false);
      }
    },
    [
      targetController,
      formData.INQInfo?.inqServicePath,
      formData.INQInfo?.perpageItem,
      formData.INQSelectField,
    ],
  );

  // Auto-fetch if no selection filters exist and on RESULTS step
  React.useEffect(() => {
    if (!hasFilters && step === "RESULTS") {
      executeQuery({});
    }
  }, [hasFilters, step, executeQuery]);

  const handleFilterSearch = (searchCrit: FilterCriteriaMap) => {
    setCriteria(searchCrit);
    executeQuery(searchCrit);
  };

  const handleResetFilters = () => {
    const cleared: FilterCriteriaMap = {};
    for (const f of formData.INQSelectField || []) {
      cleared[f.selectFieldName] = {
        value: "",
        operand: (f.selectFieldOperator as FilterCriteriaMap[string]["operand"]) || "EQ",
      };
    }
    setCriteria(cleared);
    setRows([]);
  };

  const pageSize = Number(formData.INQInfo?.perpageItem || 30) || 30;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden pr-1">
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
            fields={formData.INQSelectField || []}
            criteria={criteria}
            onCriteriaChange={setCriteria}
            onSearch={handleFilterSearch}
            onReset={handleResetFilters}
            loading={loading}
          />
        ) : (
          <InquiryTable
            columns={formData.INQDef || []}
            rows={rows}
            commands={formData.INQCmds || []}
            pageSize={pageSize}
            showSerial={formData.INQInfo?.showSerial}
          />
        )}
      </div>
    </div>
  );
}
