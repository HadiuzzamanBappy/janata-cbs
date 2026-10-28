import { Plus, Trash2 } from "lucide-react";
import { useCallback, useRef } from "react";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { UnifiedFieldFactory } from "../field-factory";

export interface ArrayTableSectionProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

export function ArrayTableSection({
  section,
  values,
  onChange,
  disabled = false,
  mode = "I",
}: ArrayTableSectionProps) {
  const bindKey = section.bindKey || section.id;
  const rows: Record<string, unknown>[] = Array.isArray(values[bindKey])
    ? (values[bindKey] as Record<string, unknown>[])
    : [];

  const isViewMode = mode !== "I";
  const isReadOnly = disabled || isViewMode;

  const rowKeyMapRef = useRef(new WeakMap<Record<string, unknown>, string>());
  const getRowKey = useCallback((row: Record<string, unknown>) => {
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
                key={f.SN}
                className="text-left px-2 py-1.5 font-medium text-foreground text-[11px] border-r border-border/60 last:border-r-0"
              >
                {f.LABEL || f.NAME}
                {f.REQUIRED && !isViewMode && (
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
                  <td key={f.SN} className="px-1.5 py-1 border-r border-border/60 last:border-r-0">
                    <UnifiedFieldFactory
                      field={f}
                      value={row[f.NAME]}
                      onChange={(_k, v) => updateCell(rowIdx, f.NAME, v)}
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
