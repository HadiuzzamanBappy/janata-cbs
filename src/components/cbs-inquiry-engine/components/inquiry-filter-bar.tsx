"use client";

import { Filter, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { FilterCriteriaMap, SelectionOperand } from "@/lib/cbs-inquiry-spec";
import type { INQSelectField } from "@/lib/data-schemas";
import { FilterCriterionRow } from "./filters/filter-criterion-row";

export interface InquiryFilterBarProps {
  fields: INQSelectField[];
  criteria?: FilterCriteriaMap;
  onCriteriaChange?: (criteria: FilterCriteriaMap) => void;
  onSearch: (criteria: FilterCriteriaMap) => void;
  onReset: () => void;
  loading?: boolean;
}

export function InquiryFilterBar({
  fields,
  criteria: controlledCriteria,
  onCriteriaChange,
  onSearch,
  onReset,
  loading = false,
}: InquiryFilterBarProps) {
  const [missingFields, setMissingFields] = React.useState<Set<string>>(new Set());
  const [internalCriteria, setInternalCriteria] = React.useState<FilterCriteriaMap>(() => {
    const initial: FilterCriteriaMap = {};
    for (const f of fields) {
      initial[f.selectFieldName] = {
        value: f.selectFieldValue || "",
        operand: (f.selectFieldOperator as SelectionOperand) || "EQ",
      };
    }
    return initial;
  });

  const criteria = controlledCriteria ?? internalCriteria;

  const updateCriteria = (updater: (prev: FilterCriteriaMap) => FilterCriteriaMap) => {
    const next = updater(criteria);
    if (!controlledCriteria) {
      setInternalCriteria(next);
    }
    if (onCriteriaChange) {
      onCriteriaChange(next);
    }
  };

  const handleValueChange = (fieldName: string, val: string) => {
    if (missingFields.has(fieldName) && val.trim() !== "") {
      setMissingFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    }
    updateCriteria((prev) => ({
      ...prev,
      [fieldName]: { ...(prev[fieldName] || { operand: "EQ" }), value: val },
    }));
  };

  const handleOperandChange = (fieldName: string, op: SelectionOperand) => {
    updateCriteria((prev) => ({
      ...prev,
      [fieldName]: { ...(prev[fieldName] || { value: "" }), operand: op },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory selection fields
    const emptyRequired = fields.filter((f) => {
      if (!f.selectFieldRequired) return false;
      const val = criteria[f.selectFieldName]?.value;
      return val === undefined || val === null || String(val).trim() === "";
    });

    if (emptyRequired.length > 0) {
      setMissingFields(new Set(emptyRequired.map((f) => f.selectFieldName)));
      const names = emptyRequired.map((f) => f.selectFieldDisplay || f.selectFieldName).join(", ");
      toast.add({
        title: "Required Filter Missing",
        description: `Please enter a value for: ${names}`,
        type: "destructive",
      });
      return;
    }

    setMissingFields(new Set());
    onSearch(criteria);
  };

  const handleClear = () => {
    setMissingFields(new Set());
    const cleared: FilterCriteriaMap = {};
    for (const f of fields) {
      cleared[f.selectFieldName] = {
        value: "",
        operand: (f.selectFieldOperator as SelectionOperand) || "EQ",
      };
    }
    if (!controlledCriteria) {
      setInternalCriteria(cleared);
    }
    if (onCriteriaChange) {
      onCriteriaChange(cleared);
    }
    onReset();
  };

  if (!fields || fields.length === 0) return null;

  return (
    <div className="h-full overflow-y-auto pr-1 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-3">
        {/* 1:1 System Screen Card Container */}
        <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
          {/* Card Header: 1:1 with Model Config & Temenos Inquiry Criteria */}
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3 text-primary" />
              <span>Selection Criteria &bull; Search Filters</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {fields.length} Field(s)
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 text-xs">
            {fields.map((field) => {
              const current = criteria[field.selectFieldName] || {
                value: field.selectFieldValue || "",
                operand: (field.selectFieldOperator as SelectionOperand) || "EQ",
              };

              return (
                <FilterCriterionRow
                  key={field.selectFieldName}
                  field={field}
                  criterion={current}
                  hasError={missingFields.has(field.selectFieldName)}
                  onValueChange={handleValueChange}
                  onOperandChange={handleOperandChange}
                />
              );
            })}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={loading}
                className="h-7 text-xs px-2.5 rounded"
              >
                Clear
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-7 text-xs px-3 font-semibold gap-1.5 rounded"
              >
                <Search className="size-3" />
                <span>Find / Execute</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
