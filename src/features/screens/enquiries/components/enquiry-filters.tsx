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
import type { SelectionField, SelectionOperand } from "../types";

export interface EnquiryFiltersProps {
  fields: SelectionField[];
  criteria?: Record<string, { value: string; operand: SelectionOperand }>;
  onCriteriaChange?: (
    criteria: Record<string, { value: string; operand: SelectionOperand }>,
  ) => void;
  onSearch: (criteria: Record<string, { value: string; operand: SelectionOperand }>) => void;
  onReset: () => void;
  onExportCSV?: () => void;
}

export function EnquiryFilters({
  fields,
  criteria: controlledCriteria,
  onCriteriaChange,
  onSearch,
  onReset,
}: Omit<EnquiryFiltersProps, "onExportCSV">) {
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
    <div className="flex-1 overflow-auto p-3 flex flex-col items-center justify-start">
      <div className="w-full max-w-xl bg-card border border-border/60 rounded-xl shadow-xs overflow-hidden mt-1">
        <div className="bg-muted/30 px-3.5 py-2 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-primary" />
            <h3 className="text-xs font-bold text-foreground">Enquiry Selection Criteria</h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {fields.length} Selection Filter(s)
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <div className="flex flex-col divide-y divide-border/30">
            {fields.map((field) => {
              const current = criteria[field.id] || { value: "", operand: field.operand };

              return (
                <div key={field.id} className="grid grid-cols-12 items-center gap-2 py-2 text-xs">
                  <label
                    htmlFor={`enq-field-${field.id}`}
                    className="col-span-4 font-medium text-foreground flex items-center justify-between pr-2 shrink-0"
                  >
                    <span className="truncate">{field.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/70 hidden sm:inline">
                      {field.id}
                    </span>
                  </label>

                  <div className="col-span-8 flex items-center gap-1.5">
                    {/* Operand Selector */}
                    <Select
                      value={current.operand}
                      onValueChange={(val: string | null) =>
                        handleOperandChange(field.id, (val ?? "EQ") as SelectionOperand)
                      }
                    >
                      <SelectTrigger className="h-8 w-20 text-xs font-mono px-2 shrink-0 bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs font-mono min-w-[100px]">
                        <SelectItem value="EQ">EQ (=)</SelectItem>
                        <SelectItem value="LK">LK (Like)</SelectItem>
                        <SelectItem value="NE">NE (!=)</SelectItem>
                        <SelectItem value="GT">GT (&gt;)</SelectItem>
                        <SelectItem value="LT">LT (&lt;)</SelectItem>
                        <SelectItem value="RG">RG (Range)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Value Input */}
                    {field.type === "select" && field.options ? (
                      <Select
                        value={current.value}
                        onValueChange={(val: string | null) =>
                          handleValueChange(field.id, val ?? "")
                        }
                      >
                        <SelectTrigger
                          id={`enq-field-${field.id}`}
                          className="h-8 text-xs font-mono bg-muted/20 w-full"
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
                        placeholder={`Enter ${field.label}...`}
                        value={current.value}
                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                        className="h-8 text-xs font-mono bg-muted/20 focus-visible:bg-background w-full"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8 text-xs px-3.5"
            >
              Clear
            </Button>
            <Button type="submit" size="sm" className="h-8 text-xs px-5 font-semibold gap-1.5">
              <Search className="size-3.5" />
              <span>Find / Execute</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
