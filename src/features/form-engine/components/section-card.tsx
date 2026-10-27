"use client";

import { ChevronDown, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormFieldItem, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
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
  const [groupCounts, setGroupCounts] = React.useState<Record<string, number>>({});

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
            {(() => {
              // Group consecutive fields that belong to the same multi-value object group
              type RenderItem =
                | { kind: "single"; field: FormFieldItem }
                | { kind: "group"; groupSn: string; groupKey?: string; fields: FormFieldItem[] };

              const renderItems: RenderItem[] = [];
              let currentGroup: {
                groupSn: string;
                groupKey?: string;
                fields: FormFieldItem[];
              } | null = null;

              for (const field of section.fields) {
                if (field.hidden) continue;

                if (field.groupSn && field.groupStructure === "M") {
                  if (currentGroup && currentGroup.groupSn === field.groupSn) {
                    currentGroup.fields.push(field);
                  } else {
                    if (currentGroup) renderItems.push({ kind: "group", ...currentGroup });
                    currentGroup = {
                      groupSn: field.groupSn,
                      groupKey: field.groupKey,
                      fields: [field],
                    };
                  }
                } else {
                  if (currentGroup) {
                    renderItems.push({ kind: "group", ...currentGroup });
                    currentGroup = null;
                  }
                  renderItems.push({ kind: "single", field });
                }
              }
              if (currentGroup) {
                renderItems.push({ kind: "group", ...currentGroup });
              }

              return renderItems.map((item) => {
                if (item.kind === "single") {
                  const field = item.field;
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
                }

                // Multi-value Object Group (Option 1: Nested Sub-Card / Fieldset Banner):
                // Each group instance (Set #1, Set #2, ...) is rendered in its own clean container
                // with a distinct header banner, actions on the top-right, and clean child field rows.
                const groupSn = item.groupSn;
                const groupFields = item.fields;
                const groupTitle =
                  groupFields[0]?.groupLabel || item.groupKey || `Group #${groupSn}`;

                // Derive number of sets from explicit form values (__group_${groupSn}_count) or state, or scan values
                const derivedFromValues = (() => {
                  if (values[`__group_${groupSn}_count`] !== undefined) {
                    return Number(values[`__group_${groupSn}_count`]) || 1;
                  }
                  let maxIdx = 0;
                  for (let i = 1; i < 50; i++) {
                    const hasVal = groupFields.some((f) => {
                      const k = `${f.fieldKey}_${i}`;
                      return values[k] !== undefined && values[k] !== null && values[k] !== "";
                    });
                    if (hasVal) maxIdx = i;
                  }
                  return maxIdx + 1;
                })();

                const currentCount = groupCounts[groupSn] ?? derivedFromValues;
                const setCount = Math.max(currentCount, 1);

                // Build stable unique keys for each group set so React does not use raw index
                const groupSets = Array.from({ length: setCount }, (_, setIdx) => {
                  const setIdentityKey =
                    setIdx === 0
                      ? `first`
                      : String(values[`__group_${groupSn}_uid_${setIdx}`] || `idx_${setIdx}`);
                  return {
                    setIdx,
                    setKey: `grp_${groupSn}_${setIdentityKey}`,
                    isLastSet: setIdx === setCount - 1,
                  };
                });

                const handleAddGroupSet = () => {
                  const newCount = setCount + 1;
                  const newSetIdx = setCount;
                  const uid =
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

                  setGroupCounts((prev) => ({ ...prev, [groupSn]: newCount }));
                  onChange(`__group_${groupSn}_count`, newCount);
                  onChange(`__group_${groupSn}_uid_${newSetIdx}`, uid);

                  // Initialize fields for the new set with empty string
                  for (const f of groupFields) {
                    const keyWithSuffix = `${f.fieldKey}_${newSetIdx}`;
                    onChange(keyWithSuffix, "");
                  }
                };

                const handleRemoveGroupSet = (removeIdx: number) => {
                  if (setCount <= 1) return;
                  const newCount = setCount - 1;
                  setGroupCounts((prev) => ({ ...prev, [groupSn]: newCount }));
                  onChange(`__group_${groupSn}_count`, newCount);

                  // Shift subsequent sets down
                  for (let i = removeIdx; i < setCount - 1; i++) {
                    const currUidKey = `__group_${groupSn}_uid_${i}`;
                    const nextUidKey = `__group_${groupSn}_uid_${i + 1}`;
                    onChange(currUidKey, values[nextUidKey] ?? "");

                    for (const f of groupFields) {
                      const currKey = i === 0 ? f.fieldKey : `${f.fieldKey}_${i}`;
                      const nextKey = `${f.fieldKey}_${i + 1}`;
                      onChange(currKey, values[nextKey] ?? "");
                    }
                  }
                  // Clear the last set
                  const lastIdx = setCount - 1;
                  onChange(`__group_${groupSn}_uid_${lastIdx}`, "");
                  for (const f of groupFields) {
                    const lastKey = lastIdx === 0 ? f.fieldKey : `${f.fieldKey}_${lastIdx}`;
                    onChange(lastKey, "");
                  }
                };

                return (
                  <div key={`group_${groupSn}`} className="col-span-full space-y-2.5 my-1">
                    {groupSets.map(({ setIdx, setKey, isLastSet }) => {
                      return (
                        <div
                          key={setKey}
                          className="rounded border border-border/80 bg-muted/15 p-2.5 shadow-2xs space-y-2.5 transition-colors"
                        >
                          {/* Sub-Card Header Banner */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                                #{groupSn}
                              </span>
                              <span className="text-xs font-semibold text-foreground tracking-tight">
                                {groupTitle} #{setIdx + 1}
                              </span>
                            </div>

                            {/* Actions Top-Right */}
                            {!disabled && mode === "I" && (
                              <div className="flex items-center gap-1.5">
                                {setCount > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRemoveGroupSet(setIdx);
                                    }}
                                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer gap-1"
                                    title="Remove this group set"
                                  >
                                    <Minus className="size-3 stroke-[2.5]" />
                                    <span>Remove</span>
                                  </Button>
                                )}
                                {isLastSet && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleAddGroupSet();
                                    }}
                                    className="h-6 px-2 text-[11px] text-primary border-primary/30 hover:bg-primary/10 rounded cursor-pointer gap-1"
                                    title={`Add another ${groupTitle}`}
                                  >
                                    <Plus className="size-3 stroke-[2.5]" />
                                    <span>Add {groupTitle}</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sub-Card Fields: Rendered in standard clean scanline rows */}
                          <div
                            className={cn(
                              "grid gap-x-4 gap-y-2 text-xs",
                              getGridColsClass(numCols),
                            )}
                          >
                            {groupFields.map((field) => {
                              const key =
                                setIdx === 0 ? field.fieldKey : `${field.fieldKey}_${setIdx}`;
                              const fieldVal = values[key];
                              const fieldError = errors[key];

                              // Clone field with the set-specific fieldKey
                              const setField: FormFieldItem = {
                                ...field,
                                id: `${field.id}_set_${setIdx}`,
                                fieldKey: key,
                              };

                              return (
                                <div
                                  key={setField.id}
                                  className={getFieldColSpanClass(numCols, setField.colSpan)}
                                >
                                  {hasKernel ? (
                                    <FieldAtom field={setField} disabled={disabled} mode={mode} />
                                  ) : (
                                    <UnifiedFieldFactory
                                      field={setField}
                                      value={fieldVal}
                                      onChange={onChange}
                                      error={fieldError}
                                      disabled={disabled}
                                      mode={mode}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        ))}
    </div>
  );
}
