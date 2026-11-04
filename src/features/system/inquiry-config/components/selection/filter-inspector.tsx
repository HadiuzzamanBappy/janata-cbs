"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/features/form-engine/utils/path-utils";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction } from "@/types";
import { FILTER_INSPECTOR_SECTIONS } from "../../fields";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";

export interface FilterInspectorProps {
  field: INQSelectField;
  selectedIdx?: number;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdate: (patch: Partial<INQSelectField>) => void;
  onRemove?: () => void;
}

export function FilterInspector({
  field,
  selectedIdx,
  disabled = false,
  validationErrors = [],
  onUpdate,
  onRemove,
}: FilterInspectorProps) {
  // Map validation errors for this criterion
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "selection" && err.itemIndex === selectedIdx) {
        const cleanKey = err.fieldKey.split(".").pop() || err.fieldKey;
        map[cleanKey] = err.message;
      }
    }
    return map;
  }, [validationErrors, selectedIdx]);

  // Centralized field change dispatcher
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      let finalVal = value;
      if (fieldKey === "selectFieldName" && typeof value === "string") {
        finalVal = value.replace(/\s+/g, "");
      } else if (fieldKey === "selectFieldOperatorFixed") {
        finalVal = value ? field.selectFieldOperator || "EQ" : "";
      }
      const updated = setFieldValue(
        field as unknown as Record<string, unknown>,
        fieldKey,
        finalVal,
      );

      // Auto-suggest display label if pristine
      if (fieldKey === "selectFieldName" && typeof value === "string") {
        const cleanName = finalVal as string;
        const currentDisplay = (field.selectFieldDisplay || "").trim();
        const prevDerived = (field.selectFieldName || "")
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        if (!currentDisplay || currentDisplay === prevDerived) {
          (updated as Record<string, unknown>).selectFieldDisplay = cleanName
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
        }
      }
      onUpdate(updated as unknown as Partial<INQSelectField>);
    },
    [field, onUpdate],
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

      {/* 2. Form Engine Rendered Filter Properties */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          <FormRenderer
            frmElements={{ sections: FILTER_INSPECTOR_SECTIONS }}
            values={
              {
                ...field,
                selectFieldOperatorFixed: Boolean(field.selectFieldOperatorFixed),
              } as Record<string, unknown>
            }
            onChange={handleFieldChange}
            errors={errorMap}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />
        </div>
      </div>
    </div>
  );
}
