"use client";

import { Filter, RotateCcw, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import type { FilterCriteriaMap, SelectionOperand } from "../types";

export interface InquiryFilterBarProps {
  fields: INQSelectField[];
  criteria?: FilterCriteriaMap;
  onCriteriaChange?: (criteria: FilterCriteriaMap) => void;
  onSearch: (criteria: FilterCriteriaMap) => void;
  onReset: () => void;
  loading?: boolean;
}

const OPERANDS: Array<{ value: SelectionOperand; label: string }> = [
  { value: "EQ", label: "=" },
  { value: "LK", label: "LIKE" },
  { value: "CT", label: "CONTAINS" },
  { value: "GT", label: ">" },
  { value: "LT", label: "<" },
  { value: "NE", label: "≠" },
];

export function InquiryFilterBar({
  fields,
  criteria: controlledCriteria,
  onCriteriaChange,
  onSearch,
  onReset,
  loading = false,
}: InquiryFilterBarProps) {
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

  const updateField = (
    fieldName: string,
    patch: Partial<{ value: string; operand: SelectionOperand }>,
  ) => {
    const next: FilterCriteriaMap = {
      ...criteria,
      [fieldName]: {
        ...(criteria[fieldName] || { value: "", operand: "EQ" }),
        ...patch,
      },
    };
    if (onCriteriaChange) {
      onCriteriaChange(next);
    } else {
      setInternalCriteria(next);
    }
  };

  const handleReset = () => {
    const resetMap: FilterCriteriaMap = {};
    for (const f of fields) {
      resetMap[f.selectFieldName] = {
        value: "",
        operand: (f.selectFieldOperator as SelectionOperand) || "EQ",
      };
    }
    if (onCriteriaChange) {
      onCriteriaChange(resetMap);
    } else {
      setInternalCriteria(resetMap);
    }
    onReset();
  };

  if (!fields || fields.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Filter className="size-3.5 text-primary" />
          <span>Search & Filter Criteria</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={loading}
            className="h-7 text-xs px-2 gap-1"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onSearch(criteria)}
            disabled={loading}
            className="h-7 text-xs px-3 gap-1.5 shadow-sm"
          >
            <Search className="size-3" />
            <span>Search</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {fields.map((f) => {
          const crit = criteria[f.selectFieldName] || { value: "", operand: "EQ" };
          return (
            <div key={f.selectFieldName} className="flex flex-col gap-1">
              <label
                htmlFor={`filter-${f.selectFieldName}`}
                className="text-[11px] font-medium text-muted-foreground truncate"
                title={f.selectFieldDisplay}
              >
                {f.selectFieldDisplay}
                {f.selectFieldRequired && <span className="text-destructive ml-0.5">*</span>}
              </label>
              <div className="flex items-center gap-1">
                <Select
                  value={crit.operand}
                  disabled={Boolean(f.selectFieldOperatorFixed)}
                  onValueChange={(op) =>
                    updateField(f.selectFieldName, { operand: op as SelectionOperand })
                  }
                >
                  <SelectTrigger className="h-7 w-[68px] text-[11px] px-1 font-mono shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERANDS.map((op) => (
                      <SelectItem key={op.value} value={op.value} className="text-xs">
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id={`filter-${f.selectFieldName}`}
                  value={crit.value}
                  onChange={(e) => updateField(f.selectFieldName, { value: e.target.value })}
                  placeholder={`Search ${f.selectFieldDisplay}...`}
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch(criteria);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
