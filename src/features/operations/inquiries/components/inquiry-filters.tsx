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
import type { SelectionField, SelectionOperand } from "@/lib/schemas";

export interface InquiryFiltersProps {
  fields: SelectionField[];
  criteria?: Record<string, { value: string; operand: SelectionOperand }>;
  onCriteriaChange?: (
    criteria: Record<string, { value: string; operand: SelectionOperand }>,
  ) => void;
  onSearch: (criteria: Record<string, { value: string; operand: SelectionOperand }>) => void;
  onReset: () => void;
  onExportCSV?: () => void;
}

export type EnquiryFiltersProps = InquiryFiltersProps;

export function InquiryFilters({
  fields,
  criteria: controlledCriteria,
  onCriteriaChange,
  onSearch,
  onReset,
}: Omit<InquiryFiltersProps, "onExportCSV">) {
  const [internalCriteria, setInternalCriteria] = React.useState<
    Record<string, { value: string; operand: SelectionOperand }>
  >(() => {
    let urlData: Record<string, unknown> = {};
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("data");
      if (raw) {
        try {
          urlData = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          // Safe parse fallback
        }
      }
    }

    const initial: Record<string, { value: string; operand: SelectionOperand }> = {};
    for (const f of fields) {
      const saved = urlData[f.id];
      const savedVal = typeof saved === "string" ? saved : f.value || "";
      initial[f.id] = { value: savedVal, operand: f.operand };
    }
    return initial;
  });

  const criteria = controlledCriteria ?? internalCriteria;

  const updateCriteria = (
    updater: (
      prev: Record<string, { value: string; operand: SelectionOperand }>,
    ) => Record<string, { value: string; operand: SelectionOperand }>,
  ) => {
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
      [id]: { ...prev[id], value: val },
    }));
  };

  const handleOperandChange = (id: string, op: SelectionOperand) => {
    updateCriteria((prev) => ({
      ...prev,
      [id]: { ...prev[id], operand: op },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  const handleClear = () => {
    const cleared: Record<string, { value: string; operand: SelectionOperand }> = {};
    for (const f of fields) {
      cleared[f.id] = { value: "", operand: f.operand };
    }
    if (!controlledCriteria) {
      setInternalCriteria(cleared);
    }
    if (onCriteriaChange) {
      onCriteriaChange(cleared);
    }
    onReset();
  };

  return (
    <div className="h-full overflow-y-auto pr-1 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-3">
        {/* 1:1 System Screen Card Container */}
        <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
          {/* Card Header: 1:1 with Model Config & User Group */}
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
              const current = criteria[field.id] || { value: "", operand: field.operand };

              return (
                <div key={field.id} className="flex items-center gap-2">
                  {/* Left Label (w-32) + ID */}
                  <label
                    htmlFor={`enq-field-${field.id}`}
                    className="w-36 shrink-0 text-xs font-medium text-muted-foreground flex items-center justify-between pr-1 select-none"
                  >
                    <span className="truncate">{field.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/60 hidden sm:inline">
                      {field.id}
                    </span>
                  </label>

                  <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    {/* Operand Selector: Compact h-7 */}
                    <Select
                      value={current.operand}
                      onValueChange={(val: string | null) =>
                        handleOperandChange(field.id, (val ?? "EQ") as SelectionOperand)
                      }
                    >
                      <SelectTrigger className="h-7 w-20 text-xs font-mono px-2 shrink-0 bg-background border-border/80 rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs font-mono min-w-[90px]">
                        <SelectItem value="EQ">EQ (=)</SelectItem>
                        <SelectItem value="LK">LK (Like)</SelectItem>
                        <SelectItem value="NE">NE (!=)</SelectItem>
                        <SelectItem value="GT">GT (&gt;)</SelectItem>
                        <SelectItem value="LT">LT (&lt;)</SelectItem>
                        <SelectItem value="RG">RG (Range)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Value Input: Compact h-7 */}
                    {field.type === "select" && field.options ? (
                      <Select
                        value={current.value}
                        onValueChange={(val: string | null) =>
                          handleValueChange(field.id, val ?? "")
                        }
                      >
                        <SelectTrigger
                          id={`enq-field-${field.id}`}
                          className="h-7 text-xs font-mono bg-background border-border/80 rounded flex-1"
                        >
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="text-xs font-mono">
                          {field.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`enq-field-${field.id}`}
                        type={field.type === "number" ? "number" : "text"}
                        placeholder={`e.g. ${field.label}...`}
                        value={current.value}
                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                        className="h-7 text-xs font-mono bg-background border-border/80 rounded flex-1"
                      />
                    )}
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
                className="h-7 text-xs px-2.5 rounded"
              >
                Clear
              </Button>
              <Button
                type="submit"
                size="sm"
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
