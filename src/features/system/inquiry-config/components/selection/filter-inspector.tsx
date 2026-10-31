"use client";

import { FileText, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";

export interface FilterInspectorProps {
  field: INQSelectField;
  selectedIdx?: number;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdate: (patch: Partial<INQSelectField>) => void;
  onRemove?: () => void;
}

const FILTER_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
];

const FILTER_OPERATORS = [
  { value: "EQ", label: "Equals (=)" },
  { value: "LK", label: "Contains (LK)" },
  { value: "GT", label: "Greater (>)" },
  { value: "LT", label: "Less (<)" },
  { value: "RG", label: "Range (..)" },
];

export function FilterInspector({
  field,
  selectedIdx,
  disabled = false,
  validationErrors = [],
  onUpdate,
  onRemove,
}: FilterInspectorProps) {
  const nameError = validationErrors.find(
    (e) =>
      e.tab === "selection" &&
      e.itemIndex === selectedIdx &&
      e.fieldKey.endsWith("selectFieldName"),
  );
  const displayError = validationErrors.find(
    (e) =>
      e.tab === "selection" &&
      e.itemIndex === selectedIdx &&
      e.fieldKey.endsWith("selectFieldDisplay"),
  );
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* 1. Header Bar */}
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            {selectedIdx !== undefined ? `Filter #${selectedIdx + 1}` : "Filter"}
          </Badge>
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
            {field.selectFieldName || "<UNNAMED_FILTER>"}
          </span>
          {field.selectFieldDisplay && (
            <span className="text-xs text-muted-foreground truncate">
              — {field.selectFieldDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase">
            {field.selectFieldOperator || "EQ"}
          </Badge>

          {!disabled && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Criterion</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Inspector Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          {/* Panel 1: Criteria Identity */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Criteria Identity</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Search Specification</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Field Key */}
              <FieldRow
                label="Field Key"
                required
                error={nameError?.message}
                enrichText="Database column or model property key used to query records (e.g. recordId, branchCode)."
              >
                <Input
                  value={field.selectFieldName}
                  disabled={disabled}
                  onChange={(e) =>
                    onUpdate({ selectFieldName: e.target.value.replace(/\s+/g, "") })
                  }
                  placeholder="e.g. recordId, branchCode"
                  className={cn(
                    "h-7 text-xs font-mono bg-background rounded border-border/80 flex-1",
                    nameError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                />
              </FieldRow>

              {/* Display Header */}
              <FieldRow
                label="Display Label"
                required
                error={displayError?.message}
                enrichText="Human-readable label displayed in the inquiry selection filter scanline."
              >
                <Input
                  value={field.selectFieldDisplay}
                  disabled={disabled}
                  onChange={(e) => onUpdate({ selectFieldDisplay: e.target.value })}
                  placeholder="e.g. Account Number, Branch Title"
                  className={cn(
                    "h-7 text-xs bg-background rounded border-border/80 flex-1",
                    displayError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                />
              </FieldRow>

              {/* Field Type Buttons */}
              <FieldRow
                label="Field Type"
                enrichText="Input widget type rendered in the inquiry selection bar."
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {FILTER_TYPES.map((t) => (
                    <Button
                      key={t.value}
                      type="button"
                      variant={
                        (field.selectFieldType || "text") === t.value ? "default" : "outline"
                      }
                      size="sm"
                      disabled={disabled}
                      onClick={() => onUpdate({ selectFieldType: t.value })}
                      className="h-7 px-3 text-xs rounded flex-1"
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </FieldRow>
            </div>
          </div>

          {/* Panel 2: Logic & Operator Constraints */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Settings2 className="size-3.5 text-primary" />
                <span>Logic & Operator Constraints</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Query Execution Rules</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Default Operand Buttons */}
              <FieldRow
                label="Default Operand"
                enrichText="Default comparison operator (EQ = Equals, LK = Like / Contains, GT = Greater Than, etc.)."
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {FILTER_OPERATORS.map((op) => (
                    <Button
                      key={op.value}
                      type="button"
                      variant={
                        (field.selectFieldOperator || "EQ") === op.value ? "default" : "outline"
                      }
                      size="sm"
                      disabled={disabled}
                      onClick={() => onUpdate({ selectFieldOperator: op.value })}
                      className="h-7 px-2.5 text-xs rounded flex-1"
                    >
                      {op.label}
                    </Button>
                  ))}
                </div>
              </FieldRow>

              {/* Pre-fill Value */}
              <FieldRow
                label="Pre-fill Value"
                enrichText="Optional initial default filter value populated when the inquiry is launched."
              >
                <Input
                  value={field.selectFieldValue || ""}
                  disabled={disabled}
                  onChange={(e) => onUpdate({ selectFieldValue: e.target.value })}
                  placeholder="Optional default prefill value..."
                  className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
                />
              </FieldRow>

              {/* Mandatory Requirement */}
              <FieldRow
                label="Mandatory"
                enrichText="When enabled, requires the operator to provide this search criterion before executing the query."
              >
                <label
                  htmlFor="ic-filter-mandatory"
                  className={cn(
                    "flex items-center gap-2 select-none",
                    disabled ? "cursor-default opacity-85" : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    id="ic-filter-mandatory"
                    checked={field.selectFieldRequired}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onUpdate({ selectFieldRequired: Boolean(checked) })
                    }
                    className="rounded"
                  />
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
                      field.selectFieldRequired
                        ? "bg-primary/10 text-primary border-primary/25"
                        : "bg-muted text-muted-foreground border-border/40",
                    )}
                  >
                    {field.selectFieldRequired ? "Yes" : "No"}
                  </span>
                </label>
              </FieldRow>

              {/* Fixed Operator Lock */}
              <FieldRow
                label="Lock Operator"
                enrichText="Locks the comparison operator so operators cannot switch operands during inquiry."
              >
                <label
                  htmlFor="ic-filter-locked"
                  className={cn(
                    "flex items-center gap-2 select-none",
                    disabled ? "cursor-default opacity-85" : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    id="ic-filter-locked"
                    checked={Boolean(field.selectFieldOperatorFixed)}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        selectFieldOperatorFixed: checked ? field.selectFieldOperator || "EQ" : "",
                      })
                    }
                    className="rounded"
                  />
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
                      field.selectFieldOperatorFixed
                        ? "bg-primary/10 text-primary border-primary/25"
                        : "bg-muted text-muted-foreground border-border/40",
                    )}
                  >
                    {field.selectFieldOperatorFixed ? "Yes" : "No"}
                  </span>
                </label>
              </FieldRow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
