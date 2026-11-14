"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { INQSelectField } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { FILTER_INSPECTOR_SECTIONS } from "../../fields/ic-filter-fields";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";
import { InspectorHeader } from "../shared/inspector-header";

export interface FilterInspectorProps {
  field: INQSelectField;
  selectedIdx?: number;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdate: (patch: Partial<INQSelectField>) => void;
  onRemove?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  showSidebarToggle?: boolean;
}

export function FilterInspector({
  field,
  selectedIdx,
  disabled = false,
  validationErrors = [],
  onUpdate,
  onRemove,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
}: FilterInspectorProps) {
  // Map validation errors for this criterion
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "filters" && err.itemIndex === selectedIdx) {
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
      <InspectorHeader
        title={field.selectFieldName}
        subtitle={field.selectFieldDisplay}
        fallbackTitle="<UNNAMED_FILTER>"
        indexBadge={selectedIdx !== undefined ? selectedIdx : "#"}
        showSidebarToggle={showSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        toggleTooltip={isSidebarOpen ? "Hide Criteria" : "Show Criteria"}
        onDelete={onRemove}
        deleteTooltip="Delete Criterion"
        disabled={disabled}
      />

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
