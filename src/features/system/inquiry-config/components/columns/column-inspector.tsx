"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import {
  formatColumnCoordinates,
  formatColumnLength,
  parseColumnCoordinates,
  parseColumnLength,
} from "@/lib/cbs-inquiry-spec";
import type { INQDef } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { COLUMN_INSPECTOR_SECTIONS } from "../../fields/ic-column-fields";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";
import { InspectorEmptyState } from "../shared/inspector-empty-state";
import { InspectorHeader } from "../shared/inspector-header";

export interface ColumnInspectorProps {
  activeCol?: INQDef;
  selectedColIdx: number;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdateColumn: (index: number, patch: Partial<INQDef>) => void;
  onRemoveColumn: (index: number) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  showSidebarToggle?: boolean;
}

export function ColumnInspector({
  activeCol,
  selectedColIdx,
  disabled = false,
  validationErrors = [],
  onUpdateColumn,
  onRemoveColumn,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
}: ColumnInspectorProps) {
  // 1. Map validation errors for this column
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "columns" && err.itemIndex === selectedColIdx) {
        const cleanKey = err.fieldKey.split(".").pop() || err.fieldKey;
        if (cleanKey === "fieldRowCol") {
          map.gridRow = err.message;
          map.gridCol = err.message;
        } else if (cleanKey === "fieldLength") {
          map.columnWidth = err.message;
          map.alignment = err.message;
        } else {
          map[cleanKey] = err.message;
        }
      }
    }
    return map;
  }, [validationErrors, selectedColIdx]);

  // 2. Prepare form values from decomposed INQDef
  const formValues = React.useMemo(() => {
    if (!activeCol) return {};
    const { length: currentLen, alignCode: currentAlign } = parseColumnLength(
      activeCol.fieldLength,
    );
    const { row: currentRow, col: currentCol } = parseColumnCoordinates(activeCol.fieldRowCol);
    return {
      fieldName: activeCol.fieldName || "",
      fieldDisplay: activeCol.fieldDisplay || "",
      fieldType: activeCol.fieldType || "DC",
      alignment: currentAlign,
      columnWidth: currentLen,
      gridRow: currentRow,
      gridCol: currentCol,
      fieldFunc: activeCol.fieldFunc || "",
      dataPassable: Boolean(activeCol.dataPassable),
    };
  }, [activeCol]);

  if (!activeCol) {
    return (
      <InspectorEmptyState message="Select a column from the left to inspect its definition." />
    );
  }

  // 3. Form Engine onRecordChange: atomically formats and emits INQDef patch
  const handleRecordChange = (next: Record<string, unknown>) => {
    const nextName = String(next.fieldName ?? "");
    let nextDisplay = String(next.fieldDisplay ?? "");

    // Auto-derive label if fieldDisplay is empty or followed the previous derived name
    const prevDerived = (activeCol.fieldName || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const currentDisplay = (activeCol.fieldDisplay || "").trim();
    if (nextName !== activeCol.fieldName && (!currentDisplay || currentDisplay === prevDerived)) {
      nextDisplay = nextName.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    onUpdateColumn(selectedColIdx, {
      fieldName: nextName,
      fieldDisplay: nextDisplay,
      fieldType: String(next.fieldType ?? "DC"),
      fieldFunc: String(next.fieldFunc ?? ""),
      fieldRowCol: formatColumnCoordinates(Number(next.gridRow) || 1, Number(next.gridCol) || 1),
      fieldLength: formatColumnLength(
        Number(next.columnWidth) || 20,
        (next.alignment || "L") as "L" | "R" | "C",
      ),
      dataPassable: Boolean(next.dataPassable),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* 1. Header Bar */}
      <InspectorHeader
        title={activeCol.fieldName}
        subtitle={activeCol.fieldDisplay}
        fallbackTitle="<UNNAMED_COLUMN>"
        indexBadge={selectedColIdx}
        showSidebarToggle={showSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        toggleTooltip={isSidebarOpen ? "Hide Columns" : "Show Columns"}
        onDelete={() => onRemoveColumn(selectedColIdx)}
        deleteTooltip="Delete Column"
        disabled={disabled}
      />

      {/* 2. Form Engine Rendered Column Properties */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          <FormRenderer
            frmElements={{ sections: COLUMN_INSPECTOR_SECTIONS }}
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
