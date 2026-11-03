"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import * as React from "react";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { InquiryValidationErrorItem } from "../hooks/ic-validation";
import { ColumnInspector } from "./columns/column-inspector";
import { ColumnModelPopover } from "./columns/column-model-popover";
import { ColumnsPanel } from "./columns/columns-panel";

export interface IcColumnsTabProps {
  columns: INQDef[];
  targetModel?: string;
  onAddColumn: (col?: Partial<INQDef>) => void;
  onUpdateColumn: (index: number, patch: Partial<INQDef>) => void;
  onRemoveColumn: (index: number) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
}

export function IcColumnsTab({
  columns,
  targetModel,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onReorderColumns,
  disabled = false,
  validationErrors = [],
}: IcColumnsTabProps) {
  const [selectedColIdx, setSelectedColIdx] = React.useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    if (columns.length === 0) {
      setSelectedColIdx(0);
    } else if (selectedColIdx >= columns.length) {
      setSelectedColIdx(columns.length - 1);
    }
  }, [columns.length, selectedColIdx]);

  const columnKeys = React.useMemo(
    () => columns.map((c, i) => `col-${c.fieldName || i}-${i}`),
    [columns],
  );

  const configuredFieldNames = React.useMemo(
    () => new Set(columns.map((c) => c.fieldName.toLowerCase())),
    [columns],
  );

  const columnsErrors = React.useMemo(
    () => validationErrors.filter((e) => e.tab === "columns"),
    [validationErrors],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = columnKeys.indexOf(String(active.id));
    const toIndex = columnKeys.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderColumns(fromIndex, toIndex);
      if (selectedColIdx === fromIndex) {
        setSelectedColIdx(toIndex);
      } else if (selectedColIdx > fromIndex && selectedColIdx <= toIndex) {
        setSelectedColIdx(selectedColIdx - 1);
      } else if (selectedColIdx < fromIndex && selectedColIdx >= toIndex) {
        setSelectedColIdx(selectedColIdx + 1);
      }
    }
  };

  const handleImportProperty = (prop: ModelProperty) => {
    const typeUpper = (prop.TYPE || "CHAR").toUpperCase();
    let fieldType = "CH";
    let alignment = "L";

    if (typeUpper === "AMOUNT" || typeUpper === "INTEGER" || typeUpper === "NUMBER") {
      fieldType = typeUpper === "AMOUNT" ? "AMT" : "NUM";
      alignment = "R";
    } else if (typeUpper === "DATE") {
      fieldType = "D";
      alignment = "C";
    }

    const defaultLength = Math.min(Math.max(prop.LENGTH || 20, 10), 100);

    onAddColumn({
      fieldName: prop.NAME,
      fieldDisplay: prop.LABEL || prop.NAME,
      fieldType,
      fieldLength: `${defaultLength},${alignment}`,
      fieldRowCol: "1,1",
      dataPassable: true,
    });
    setSelectedColIdx(columns.length);
  };

  const activeCol = columns[selectedColIdx] || null;

  return (
    <div className="h-full flex min-h-0 overflow-hidden pr-1 gap-2">
      <div className="w-80 shrink-0 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
        <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Columns ({columns.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <ColumnModelPopover
              targetModel={targetModel}
              disabled={disabled}
              configuredFieldNames={configuredFieldNames}
              onImportProperty={handleImportProperty}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  onAddColumn();
                  setSelectedColIdx(columns.length);
                }}
                className="h-6 text-xs px-2 gap-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center cursor-pointer"
              >
                <span>+ Custom</span>
              </button>
            )}
          </div>
        </div>

        <ColumnsPanel
          columns={columns}
          selectedColIdx={selectedColIdx}
          onSelectColumn={setSelectedColIdx}
          onRemoveColumn={onRemoveColumn}
          disabled={disabled}
          validationErrors={columnsErrors}
          sensors={sensors}
          columnKeys={columnKeys}
          onDragEnd={handleDragEnd}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
        <ColumnInspector
          activeCol={activeCol || undefined}
          selectedColIdx={selectedColIdx}
          disabled={disabled}
          validationErrors={columnsErrors}
          onUpdateColumn={onUpdateColumn}
          onRemoveColumn={onRemoveColumn}
        />
      </div>
    </div>
  );
}
