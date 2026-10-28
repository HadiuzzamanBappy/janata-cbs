"use client";

import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/core-utils";
import type { FormConfigRecord, RoutineItem } from "@/lib/data-schemas/form-config-schema";
import { FORM_ROUTINE_GROUPS, type RoutineGroupDef, type RoutineKey } from "../fields";

export interface FcRoutineTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
}

export function FcRoutineTab({ formData, setFormData, isReadOnly = false }: FcRoutineTabProps) {
  const handleAddRoutine = React.useCallback(
    (key: RoutineKey) => {
      if (isReadOnly) return;
      const newRoutine: RoutineItem = {
        id: `rtn_${Math.floor(Math.random() * 10000)}_${Math.random().toString(36).slice(2, 7)}`,
        routineName: "",
        routineDescription: "",
      };
      setFormData((prev) => ({
        ...prev,
        frmRoutine: {
          ...(prev.frmRoutine || {
            rtnValidate: [],
            rtnBeforeAuth: [],
            rtnAfterAuth: [],
          }),
          [key]: [...(prev.frmRoutine?.[key] || []), newRoutine],
        },
      }));
    },
    [isReadOnly, setFormData],
  );

  const handleUpdateRoutine = React.useCallback(
    (key: RoutineKey, index: number, field: keyof RoutineItem, value: string) => {
      if (isReadOnly) return;
      setFormData((prev) => {
        const currentList = [...(prev.frmRoutine?.[key] || [])];
        if (!currentList[index]) return prev;
        currentList[index] = {
          ...currentList[index],
          [field]: value,
        };
        return {
          ...prev,
          frmRoutine: {
            ...(prev.frmRoutine || {
              rtnValidate: [],
              rtnBeforeAuth: [],
              rtnAfterAuth: [],
            }),
            [key]: currentList,
          },
        };
      });
    },
    [isReadOnly, setFormData],
  );

  const handleRemoveRoutine = React.useCallback(
    (key: RoutineKey, index: number) => {
      if (isReadOnly) return;
      setFormData((prev) => {
        const currentList = [...(prev.frmRoutine?.[key] || [])];
        currentList.splice(index, 1);
        return {
          ...prev,
          frmRoutine: {
            ...(prev.frmRoutine || {
              rtnValidate: [],
              rtnBeforeAuth: [],
              rtnAfterAuth: [],
            }),
            [key]: currentList,
          },
        };
      });
    },
    [isReadOnly, setFormData],
  );

  const routineData = formData.frmRoutine || {
    rtnValidate: [],
    rtnBeforeAuth: [],
    rtnAfterAuth: [],
  };

  return (
    <div className="h-full overflow-y-auto select-none pr-1">
      <div className="max-w-3xl space-y-3 pb-8">
        {FORM_ROUTINE_GROUPS.map((group: RoutineGroupDef) => {
          const routines: RoutineItem[] = routineData[group.key] || [];

          return (
            <div
              key={group.key}
              className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
            >
              {/* Field Group Header */}
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
                <span>{group.title}</span>
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleAddRoutine(group.key)}
                    className="h-5 w-5 p-0 rounded font-normal text-muted-foreground hover:text-foreground border-border/80"
                    title={`Add new ${group.fieldLabel}`}
                  >
                    <Plus className="size-3" />
                  </Button>
                )}
              </div>

              {/* Multi-Field Rows */}
              <div className="space-y-2.5 text-xs">
                {routines.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none flex items-center">
                      <span className="truncate">{group.fieldLabel}</span>
                    </Label>
                    <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                    <span className="text-[11px] text-muted-foreground/70 italic truncate">
                      No routine hooks configured
                    </span>
                  </div>
                ) : (
                  routines.map((routine, idx) => (
                    <div
                      key={routine.id || `${group.key}_${idx}`}
                      className="flex items-center gap-2"
                    >
                      <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none flex items-center">
                        <span className="truncate" title={`${group.fieldLabel} ${idx + 1}`}>
                          {group.fieldLabel} {routines.length > 1 ? `.${idx + 1}` : ""}
                        </span>
                      </Label>
                      <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

                      <div className="w-56 shrink-0">
                        <Input
                          disabled={isReadOnly}
                          placeholder={group.placeholder}
                          value={routine.routineName}
                          onChange={(e) =>
                            handleUpdateRoutine(
                              group.key,
                              idx,
                              "routineName",
                              e.target.value.toUpperCase(),
                            )
                          }
                          className={cn(
                            "h-7 text-xs font-mono uppercase bg-background rounded border-border/80",
                            isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                          )}
                        />
                      </div>

                      <div className="flex-1">
                        <Input
                          disabled={isReadOnly}
                          placeholder="Functional summary or execution conditions..."
                          value={routine.routineDescription}
                          onChange={(e) =>
                            handleUpdateRoutine(
                              group.key,
                              idx,
                              "routineDescription",
                              e.target.value,
                            )
                          }
                          className={cn(
                            "h-7 text-xs bg-background rounded border-border/80",
                            isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                          )}
                        />
                      </div>

                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRoutine(group.key, idx)}
                          className="h-7 w-7 p-0 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Remove routine"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
