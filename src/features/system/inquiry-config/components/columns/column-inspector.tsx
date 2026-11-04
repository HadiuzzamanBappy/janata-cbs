"use client";

import { Trash2 } from "lucide-react";
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
}

export function ColumnInspector({
  activeCol,
  selectedColIdx,
  disabled = false,
  validationErrors = [],
  onUpdateColumn,
  onRemoveColumn,
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
    fieldType: activeCol.fieldType || "CH",
    alignment: currentAlign,
    columnWidth: currentLen,
    gridRow: currentRow,
    gridCol: currentCol,
    fieldFunc: activeCol.fieldFunc || "",
    dataPassable: Boolean(activeCol.dataPassable),
  };

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    if (fieldKey === "fieldName" && typeof value === "string") {
      onUpdateColumn(selectedColIdx, {
        fieldName: value.replace(/\s+/g, ""),
      });
    } else if (fieldKey === "fieldDisplay") {
      onUpdateColumn(selectedColIdx, { fieldDisplay: String(value ?? "") });
    } else if (fieldKey === "fieldType") {
      onUpdateColumn(selectedColIdx, { fieldType: String(value ?? "CH") });
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
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            Col #{selectedColIdx + 1}
          </Badge>
          <span className="text-xs font-bold text-foreground tracking-wide truncate">
            {activeCol.fieldDisplay || activeCol.fieldName || "<UNNAMED_COLUMN>"}
          </span>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveColumn(selectedColIdx)}
            className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Column</span>
          </Button>
        )}
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
