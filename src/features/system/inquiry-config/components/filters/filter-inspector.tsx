"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import type { INQSelectField, InquiryFieldType, SelectionOperand } from "@/lib/data-schemas";
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
  // 1. Map validation errors for this criterion
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

  // 2. Prepare values dictionary for Form Engine
  const formValues = React.useMemo(
    () => ({
      ...field,
      selectFieldOperatorFixed: Boolean(field.selectFieldOperatorFixed),
    }),
    [field],
  );

  // 3. Form Engine onRecordChange: atomically formats and emits INQSelectField patch
  const handleRecordChange = (next: Record<string, unknown>) => {
    const nextName = String(next.selectFieldName ?? "");
    let nextDisplay = String(next.selectFieldDisplay ?? "");

    // Auto-derive display label if untouched or followed the previous derived name
    const prevDerived = (field.selectFieldName || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const currentDisplay = (field.selectFieldDisplay || "").trim();
    if (nextName !== field.selectFieldName && (!currentDisplay || currentDisplay === prevDerived)) {
      nextDisplay = nextName.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const isFixed = Boolean(next.selectFieldOperatorFixed);
    const operator = (next.selectFieldOperator as SelectionOperand) || "EQ";

    onUpdate({
      selectFieldName: nextName,
      selectFieldDisplay: nextDisplay,
      selectFieldType: (next.selectFieldType as InquiryFieldType) || "text",
      selectFieldOperator: operator,
      selectFieldOperatorFixed: isFixed ? operator : "",
      selectFieldValue: String(next.selectFieldValue ?? ""),
      selectFieldRequired: Boolean(next.selectFieldRequired),
    });
  };

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
            values={formValues}
            onRecordChange={handleRecordChange}
            errors={errorMap}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />
        </div>
      </div>
    </div>
  );
}
