"use client";

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { FormKernelContext } from "../store/form-kernel-provider";
import { FieldAtom } from "./field-atom";
import { UnifiedFieldFactory } from "./field-factory";

export interface SectionCardProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  hideHeader?: boolean;
}

/**
 * Array Table Section:
 * Renders repeating sub-records in an inline editable table grid with Add / Remove rows.
 */
function ArrayTableSection({
  section,
  values,
  onChange,
  disabled,
  mode,
}: {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
  mode?: CbsScreenMode;
}) {
  const bindKey = section.bindKey || section.id;
  const rows: Record<string, unknown>[] = Array.isArray(values[bindKey])
    ? (values[bindKey] as Record<string, unknown>[])
    : [];

  const isViewMode = mode !== "I";
  const isReadOnly = disabled || isViewMode;

  const rowKeyMapRef = React.useRef(new WeakMap<Record<string, unknown>, string>());
  const getRowKey = React.useCallback((row: Record<string, unknown>) => {
    if (typeof row.id === "string" && row.id) return row.id;
    if (typeof row._rowId === "string" && row._rowId) return row._rowId;
    if (typeof row.key === "string" && row.key) return row.key;
    let cached = rowKeyMapRef.current.get(row);
    if (!cached) {
      cached = `row_${Math.random().toString(36).slice(2, 9)}`;
      rowKeyMapRef.current.set(row, cached);
    }
    return cached;
  }, []);

  const addRow = () => {
    const newRowId = `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    onChange(bindKey, [...rows, { _rowId: newRowId }]);
  };

  const deleteRow = (index: number) => {
    onChange(
      bindKey,
      rows.filter((_, idx) => idx !== index),
    );
  };

  const updateCell = (rowIndex: number, fieldKey: string, cellVal: unknown) => {
    const next = rows.map((r, i) => (i === rowIndex ? { ...r, [fieldKey]: cellVal } : r));
    onChange(bindKey, next);
  };

  return (
    <div className="space-y-2 overflow-x-auto pt-1">
      <table className="w-full text-xs border-collapse border border-border/80 rounded bg-background">
        <thead>
          <tr className="bg-muted/40 border-b border-border/80">
            <th className="w-8 text-center px-2 py-1.5 font-mono text-[10px] text-muted-foreground border-r border-border/60">
              #
            </th>
            {section.fields.map((f) => (
              <th
                key={f.id}
                className="text-left px-2 py-1.5 font-medium text-foreground text-[11px] border-r border-border/60 last:border-r-0"
              >
                {f.label}
                {f.required && !isViewMode && (
                  <span className="text-destructive font-bold ml-0.5">*</span>
                )}
              </th>
            ))}
            {!isReadOnly && (
              <th className="w-10 text-center px-1 py-1.5 text-[10px] text-muted-foreground" />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={section.fields.length + (isReadOnly ? 1 : 2)}
                className="text-center py-4 text-xs text-muted-foreground/70 italic"
              >
                No entries added yet.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-border/60 last:border-b-0 hover:bg-muted/20"
              >
                <td className="text-center font-mono text-[10px] text-muted-foreground px-1 py-1 border-r border-border/60">
                  {rowIdx + 1}
                </td>
                {section.fields.map((f) => (
                  <td key={f.id} className="px-1.5 py-1 border-r border-border/60 last:border-r-0">
                    <UnifiedFieldFactory
                      field={f}
                      value={row[f.fieldKey]}
                      onChange={(_k, v) => updateCell(rowIdx, f.fieldKey, v)}
                      disabled={isReadOnly}
                      mode={mode}
                    />
                  </td>
                ))}
                {!isReadOnly && (
                  <td className="text-center px-1 py-1">
                    <button
                      type="button"
                      onClick={() => deleteRow(rowIdx)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove row"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!isReadOnly && (
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer bg-transparent border-0 p-0"
        >
          <Plus className="size-3" />
          <span>Add Row</span>
        </button>
      )}
    </div>
  );
}

export function SectionCard({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  hideHeader = false,
}: SectionCardProps) {
  const hasKernel = Boolean(React.useContext(FormKernelContext));
  const [collapsed, setCollapsed] = React.useState<boolean>(section.isCollapsed ?? false);

  const isPlain = section.layoutStyle === "plain";
  const isObjectGroup = section.type === "object-group";

  const numCols = section.columns || 1;

  const getGridColsClass = (cols: number) => {
    switch (cols) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      default:
        return "grid-cols-1";
    }
  };

  const getFieldColSpanClass = (cols: number, span?: number) => {
    if (cols <= 1) {
      switch (span) {
        case 3:
          return "w-full sm:max-w-[25%] sm:min-w-[200px]";
        case 4:
          return "w-full sm:max-w-[33.333%] sm:min-w-[240px]";
        case 6:
          return "w-full sm:max-w-[50%] sm:min-w-[280px]";
        case 8:
          return "w-full sm:max-w-[66.666%] sm:min-w-[320px]";
        default:
          return "w-full";
      }
    }
    if (cols === 2) {
      return span && span >= 12 ? "col-span-2 w-full" : "col-span-1 w-full";
    }
    if (cols === 3) {
      if (span && span >= 12) return "col-span-3 w-full";
      if (span && span >= 8) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
    if (cols === 4) {
      if (span && span >= 12) return "col-span-4 w-full";
      if (span && span >= 9) return "col-span-3 w-full";
      if (span && span >= 6) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
    return "w-full";
  };

  return (
    <div
      className={cn(
        "transition-all duration-150",
        isPlain || hideHeader
          ? "py-1 space-y-2"
          : "rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5",
        isObjectGroup && "bg-muted/10 border-dashed",
      )}
    >
      {/* Section Header */}
      {!hideHeader && (section.title || section.collapsible || !isPlain) && (
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            {section.collapsible && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              >
                {collapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            )}
            {section.title && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </span>
            )}
            {section.description && (
              <span className="text-[11px] text-muted-foreground/60 font-normal">
                &bull; {section.description}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Array Table Section vs Dynamic Grid Form Fields */}
      {!collapsed &&
        (section.type === "array-table" ? (
          <ArrayTableSection
            section={section}
            values={values}
            onChange={onChange}
            disabled={disabled}
            mode={mode}
          />
        ) : (
          <div className={cn("grid gap-x-4 gap-y-2.5 text-xs pt-1", getGridColsClass(numCols))}>
            {section.fields.map((field) => {
              if (field.hidden) return null;

              return (
                <div key={field.id} className={getFieldColSpanClass(numCols, field.colSpan)}>
                  {hasKernel ? (
                    <FieldAtom field={field} disabled={disabled} mode={mode} />
                  ) : (
                    <UnifiedFieldFactory
                      field={field}
                      value={values[field.fieldKey]}
                      onChange={onChange}
                      error={errors[field.fieldKey]}
                      disabled={disabled}
                      mode={mode}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
