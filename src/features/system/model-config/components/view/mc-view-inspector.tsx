"use client";

import { Eye, LayoutGrid, Plus, Table2, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ViewDefField, ViewDefItem } from "@/lib/data-schemas/model-config-schema";

interface McViewInspectorProps {
  view?: ViewDefItem;
  viewIdx: number;
  defaultTableName?: string;
  isReadOnly: boolean;
  onUpdateView: (patch: Partial<ViewDefItem>) => void;
  onAddField: () => void;
  onUpdateField: (fieldIdx: number, patch: Partial<ViewDefField>) => void;
  onDeleteField: (fieldIdx: number) => void;
}

export function McViewInspector({
  view,
  viewIdx,
  defaultTableName,
  isReadOnly,
  onUpdateView,
  onAddField,
  onUpdateField,
  onDeleteField,
}: McViewInspectorProps) {
  // Stable identity mapping for React rendering of projected fields without index keys
  const fieldKeyMapRef = React.useRef(new WeakMap<ViewDefField, string>());
  const nextFieldIdRef = React.useRef(1);

  const getFieldKey = React.useCallback((field: ViewDefField): string => {
    let key = fieldKeyMapRef.current.get(field);
    if (!key) {
      key = `field_${nextFieldIdRef.current++}`;
      fieldKeyMapRef.current.set(field, key);
    }
    return key;
  }, []);

  if (!view) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
        <LayoutGrid className="size-8 text-muted-foreground/35 mb-2" />
        <p className="text-xs text-muted-foreground/80">
          Select a view on the left or click &quot;Add View&quot; to create a new projection
        </p>
      </div>
    );
  }

  const fields = view.FIELDS || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          {/* Panel 1: View Identity */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="size-3.5 text-primary" />
                <span>View Identity & Specification</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                View #{viewIdx + 1}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* View Name */}
              <div className="min-h-7 flex items-center gap-2">
                <Label className="w-28 shrink-0 text-xs font-normal text-muted-foreground select-none">
                  View Name <span className="text-destructive font-semibold ml-0.5">*</span>
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs">:</span>
                <Input
                  value={view.VIEWNAME}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    onUpdateView({
                      VIEWNAME: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    })
                  }
                  placeholder="e.g. V_CUSTOMER_PROFILE"
                  className="h-7 rounded text-xs font-mono uppercase bg-background border-border/80 max-w-md flex-1"
                />
              </div>

              {/* Description */}
              <div className="min-h-7 flex items-center gap-2">
                <Label className="w-28 shrink-0 text-xs text-muted-foreground font-normal select-none">
                  Description
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs">:</span>
                <Input
                  value={view.DESCRIPTION}
                  disabled={isReadOnly}
                  onChange={(e) => onUpdateView({ DESCRIPTION: e.target.value })}
                  placeholder="e.g. Customer profile projection view"
                  className="h-7 rounded text-xs bg-background border-border/80 max-w-md flex-1"
                />
              </div>
            </div>
          </div>

          {/* Panel 2: Projected Field Mappings */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Table2 className="size-3.5 text-primary" />
                <span>Projected Columns ({fields.length})</span>
              </div>

              {!isReadOnly && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onAddField}
                  className="h-6 text-[11px] gap-1 px-2 rounded"
                >
                  <Plus className="size-3" />
                  <span>Add Column</span>
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              {fields.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground select-none">
                  No projected columns mapped. Click &quot;Add Column&quot; to map table fields.
                </div>
              ) : (
                <div className="divide-y divide-border/30 rounded border border-border/60 overflow-hidden bg-background">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 p-1.5 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase select-none">
                    <div className="col-span-1 text-center font-mono">#</div>
                    <div className="col-span-5">Source Table</div>
                    <div className="col-span-5">Column / Field Name</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>

                  {/* Field Rows */}
                  {fields.map((field, fIdx) => {
                    const fieldKey = getFieldKey(field);
                    return (
                      <div
                        key={fieldKey}
                        className="grid grid-cols-12 gap-2 p-1.5 items-center hover:bg-muted/10 transition-colors"
                      >
                        <div className="col-span-1 text-center font-mono text-[11px] text-muted-foreground">
                          {fIdx + 1}
                        </div>
                        <div className="col-span-5">
                          <Input
                            value={field.TABLENAME}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              onUpdateField(fIdx, {
                                TABLENAME: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                              })
                            }
                            placeholder={defaultTableName || "TABLE_NAME"}
                            className="h-6.5 text-xs font-mono uppercase rounded bg-background border-border/80"
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            value={field.FIELDNAME}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              onUpdateField(fIdx, {
                                FIELDNAME: e.target.value.replace(/\s+/g, ""),
                              })
                            }
                            placeholder="e.g. accountId"
                            className="h-6.5 text-xs font-mono rounded bg-background border-border/80"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Remove column"
                              onClick={() => onDeleteField(fIdx)}
                              className="size-5 p-0 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
