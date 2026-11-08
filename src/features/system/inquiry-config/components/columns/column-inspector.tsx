"use client";

import { PanelLeft, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction } from "@/types";
import { COLUMN_INSPECTOR_SECTIONS } from "../../fields";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";

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
        map[cleanKey] = err.message;
      }
    }
    return map;
  }, [validationErrors, selectedColIdx]);

  if (!activeCol) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
        <p className="text-xs font-mono">
          Select a column from the left to inspect its definition.
        </p>
      </div>
    );
  }

  // Decompose length & alignment (e.g. "20,L")
  const [lenPart, alignPart] = (activeCol.fieldLength || "20,L").split(",");
  const currentLen = Number(lenPart?.trim()) || 20;
  const currentAlign = alignPart?.trim().toUpperCase() || "L";

  // Decompose grid row & col (e.g. "1,2")
  const [rowPart, colPart] = (activeCol.fieldRowCol || "1,1").split(",");
  const currentRow = Number(rowPart?.trim()) || 1;
  const currentCol = Number(colPart?.trim()) || 1;

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
        fieldLength: `${currentLen},${String(value || "L")}`,
      });
    } else if (fieldKey === "columnWidth") {
      const widthVal = Number(value) || 20;
      onUpdateColumn(selectedColIdx, {
        fieldLength: `${widthVal},${currentAlign}`,
      });
    } else if (fieldKey === "gridRow") {
      const rowVal = Number(value) || 1;
      onUpdateColumn(selectedColIdx, {
        fieldRowCol: `${rowVal},${currentCol}`,
      });
    } else if (fieldKey === "gridCol") {
      const colVal = Number(value) || 1;
      onUpdateColumn(selectedColIdx, {
        fieldRowCol: `${currentRow},${colVal}`,
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
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {showSidebarToggle && onToggleSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onToggleSidebar}
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 mr-0.5"
              title={isSidebarOpen ? "Hide Columns" : "Show Columns"}
            >
              <PanelLeft className="size-3.5" />
            </Button>
          )}

          {activeCol.fieldName &&
          activeCol.fieldDisplay &&
          activeCol.fieldName !== activeCol.fieldDisplay ? (
            <>
              <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
                {activeCol.fieldName}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                — {activeCol.fieldDisplay}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-foreground tracking-wide truncate">
              {activeCol.fieldDisplay || activeCol.fieldName || "<UNNAMED_COLUMN>"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs shrink-0"
          >
            #{selectedColIdx + 1}
          </Badge>

          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemoveColumn(selectedColIdx)}
              className="size-7 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
              title="Delete Column"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

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
