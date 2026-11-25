"use client";

import { Filter, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { FilterCriteriaMap, INQSelectField, SelectionOperand } from "@/lib/data-schemas";
import { FilterCriterionRow } from "./filters/filter-criterion-row";

export interface InquiryFilterBarProps {
  fields: readonly INQSelectField[];
  inquiryName: string;
  criteria: FilterCriteriaMap;
  onCriteriaChange: (criteria: FilterCriteriaMap) => void;
  onSearch: (criteria: FilterCriteriaMap) => void;
  loading: boolean;
}

/** The criteria step of an inquiry: one row per configured filter, then Clear and Find. */
export function InquiryFilterBar({
  fields,
  inquiryName,
  criteria,
  onCriteriaChange,
  onSearch,
  loading,
}: InquiryFilterBarProps) {
  const [missingFields, setMissingFields] = React.useState<ReadonlySet<string>>(new Set());

  const criterionOf = (field: INQSelectField) =>
    criteria[field.selectFieldName] ?? {
      value: field.selectFieldValue,
      operand: field.selectFieldOperator,
    };

  const handleValueChange = (field: INQSelectField, value: string) => {
    if (value.trim() && missingFields.has(field.selectFieldName)) {
      setMissingFields((prev) => new Set([...prev].filter((n) => n !== field.selectFieldName)));
    }
    onCriteriaChange({ ...criteria, [field.selectFieldName]: { ...criterionOf(field), value } });
  };

  const handleOperandChange = (field: INQSelectField, operand: SelectionOperand) => {
    onCriteriaChange({ ...criteria, [field.selectFieldName]: { ...criterionOf(field), operand } });
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emptyRequired = fields.filter(
      (f) => f.selectFieldRequired && !criterionOf(f).value.trim(),
    );
    if (emptyRequired.length > 0) {
      setMissingFields(new Set(emptyRequired.map((f) => f.selectFieldName)));
      toast.add({
        title: "Required Filter Missing",
        description: `Please enter a value for: ${emptyRequired.map((f) => f.selectFieldDisplay || f.selectFieldName).join(", ")}`,
        type: "destructive",
      });
      return;
    }
    setMissingFields(new Set());
    onSearch(criteria);
  };

  /** Empties every value; each operand returns to its configured one. */
  const handleClear = () => {
    setMissingFields(new Set());
    const cleared: FilterCriteriaMap = {};
    for (const f of fields)
      cleared[f.selectFieldName] = { value: "", operand: f.selectFieldOperator };
    onCriteriaChange(cleared);
  };

  return (
    <div className="h-full overflow-y-auto pr-1 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-3">
        <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
          <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3 text-primary" />
              <span>Selection Criteria &bull; Search Filters</span>
            </div>
            <span className="text-3xs font-mono text-muted-foreground">
              {fields.length} Field(s)
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-2 text-xs">
            {fields.length === 0 && (
              <p className="text-2xs text-muted-foreground">
                This inquiry has no filters: Find runs it as configured.
              </p>
            )}
            {fields.map((field) => (
              <FilterCriterionRow
                key={field.selectFieldName}
                field={field}
                criterion={criterionOf(field)}
                hasError={missingFields.has(field.selectFieldName)}
                onValueChange={handleValueChange}
                onOperandChange={handleOperandChange}
              />
            ))}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
              <span
                className="text-xs font-mono text-muted-foreground truncate select-none min-w-0"
                title={inquiryName}
              >
                {inquiryName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
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
                  <span>{loading ? "Running…" : "Find / Execute"}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
