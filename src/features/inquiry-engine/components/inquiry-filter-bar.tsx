"use client";

import { Filter, Search } from "lucide-react";
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

  const updateCriteria = (updater: (prev: FilterCriteriaMap) => FilterCriteriaMap) => {
    const next = updater(criteria);
    if (!controlledCriteria) {
      setInternalCriteria(next);
    }
    if (onCriteriaChange) {
      onCriteriaChange(next);
    }
  };

  const handleValueChange = (id: string, val: string) => {
    updateCriteria((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { operand: "EQ" }), value: val },
    }));
  };

  const handleOperandChange = (id: string, op: SelectionOperand) => {
    updateCriteria((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { value: "" }), operand: op },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  const handleClear = () => {
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
                <div key={field.selectFieldName} className="flex items-center gap-2">
                  {/* Left Label (w-40) + fieldName */}
                  <label
                    htmlFor={`inq-filter-${field.selectFieldName}`}
                    className="w-40 shrink-0 text-xs font-medium text-muted-foreground flex items-center justify-between pr-1 select-none"
                  >
                    <span className="truncate">{field.selectFieldDisplay}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/60 hidden sm:inline">
                      {field.selectFieldName}
                    </span>
                  </label>

                  <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    {/* Operand Selector: Compact h-7 font-mono */}
                    <Select
                      value={current.operand}
                      disabled={Boolean(field.selectFieldOperatorFixed)}
                      onValueChange={(val: string | null) =>
                        handleOperandChange(
                          field.selectFieldName,
                          (val ?? "EQ") as SelectionOperand,
                        )
                      }
                    >
                      <SelectTrigger className="h-7 w-22 text-xs font-mono px-2 shrink-0 bg-background border-border/80 rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs font-mono min-w-24">
                        <SelectItem value="EQ">EQ (=)</SelectItem>
                        <SelectItem value="LK">LK (Like)</SelectItem>
                        <SelectItem value="CT">CT (Contains)</SelectItem>
                        <SelectItem value="NE">NE (!=)</SelectItem>
                        <SelectItem value="GT">GT (&gt;)</SelectItem>
                        <SelectItem value="LT">LT (&lt;)</SelectItem>
                        <SelectItem value="RG">RG (Range)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Value Input: Compact h-7 font-mono */}
                    <Input
                      id={`inq-filter-${field.selectFieldName}`}
                      type={field.selectFieldType === "number" ? "number" : "text"}
                      placeholder={`e.g. ${field.selectFieldDisplay}...`}
                      value={current.value}
                      onChange={(e) => handleValueChange(field.selectFieldName, e.target.value)}
                      className="h-7 text-xs font-mono bg-background border-border/80 rounded flex-1"
                    />
                  </div>
                </div>
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
