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

  if (!activeCol) {
    return (
      <InspectorEmptyState message="Select a column from the left to inspect its definition." />
    );
  }

  // Decompose length & alignment using centralized inquiry engine helper
  const { length: currentLen, alignCode: currentAlign } = parseColumnLength(activeCol.fieldLength);

  // Decompose grid row & col using centralized inquiry engine helper
  const { row: currentRow, col: currentCol } = parseColumnCoordinates(activeCol.fieldRowCol);

  const formValues = {
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

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    if (fieldKey === "fieldName" && typeof value === "string") {
      const cleanName = value.replace(/\s+/g, "");
      const patch: Partial<INQDef> = { fieldName: cleanName };
      const currentDisplay = (activeCol.fieldDisplay || "").trim();
      const prevDerived = (activeCol.fieldName || "")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (!currentDisplay || currentDisplay === prevDerived) {
        patch.fieldDisplay = cleanName
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
      onUpdateColumn(selectedColIdx, patch);
    } else if (fieldKey === "fieldDisplay") {
      onUpdateColumn(selectedColIdx, { fieldDisplay: String(value ?? "") });
    } else if (fieldKey === "fieldType") {
      onUpdateColumn(selectedColIdx, { fieldType: String(value ?? "DC") });
    } else if (fieldKey === "alignment") {
      onUpdateColumn(selectedColIdx, {
        fieldLength: formatColumnLength(currentLen, (value || "L") as "L" | "R" | "C"),
      });
    } else if (fieldKey === "columnWidth") {
      const widthVal = Number(value) || 20;
      onUpdateColumn(selectedColIdx, {
        fieldLength: formatColumnLength(widthVal, currentAlign),
      });
    } else if (fieldKey === "gridRow") {
      const rowVal = Number(value) || 1;
      onUpdateColumn(selectedColIdx, {
        fieldRowCol: formatColumnCoordinates(rowVal, currentCol),
      });
    } else if (fieldKey === "gridCol") {
      const colVal = Number(value) || 1;
      onUpdateColumn(selectedColIdx, {
        fieldRowCol: formatColumnCoordinates(currentRow, colVal),
      });
    } else if (fieldKey === "fieldFunc") {
      onUpdateColumn(selectedColIdx, { fieldFunc: String(value ?? "") });
    } else if (fieldKey === "dataPassable") {
      onUpdateColumn(selectedColIdx, { dataPassable: Boolean(value) });
    }
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
            values={formValues as Record<string, unknown>}
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
