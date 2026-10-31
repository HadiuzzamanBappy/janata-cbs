"use client";

import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { FormConfigRecord, RoutineItem } from "@/lib/data-schemas/form-config-schema";
import { FORM_ROUTINE_GROUPS, type RoutineGroupDef, type RoutineKey } from "../fields";
import type { FormConfigValidationError } from "../hooks/fc-validation";

export interface FcRoutineTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
  validationErrors?: FormConfigValidationError[];
}

export function FcRoutineTab({
  formData,
  setFormData,
  isReadOnly = false,
  validationErrors = [],
}: FcRoutineTabProps) {
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

              {/* Multi-Field Rows / Grouping Blocks */}
              <div className="space-y-3 text-xs">
                {routines.length === 0 ? (
                  <FieldRow label={group.fieldLabel} enrichText={group.description}>
                    <span className="text-[11px] text-muted-foreground/70 italic truncate">
                      No routine hooks configured
                    </span>
                  </FieldRow>
                ) : (
                  routines.map((routine, idx) => {
                    const fieldError = validationErrors.find(
                      (e) =>
                        e.tab === "formRoutine" && e.fieldKey === `${group.key}.${idx}.routineName`,
                    );

                    return (
                      <div
                        key={routine.id || `${group.key}_${idx}`}
                        className="rounded border border-border/70 bg-muted/20 p-2.5 space-y-2 shadow-2xs"
                      >
                        {/* Group Header: Title with item index and icon action buttons */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                          <span className="text-xs font-semibold text-foreground tracking-tight select-none">
                            {group.fieldLabel} #{idx + 1}
                          </span>

                          {!isReadOnly && (
                            <div className="flex items-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRoutine(group.key, idx)}
                                className="size-5 p-0 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                                title={`Remove ${group.fieldLabel} #${idx + 1}`}
                              >
                                <Minus className="size-3.5 stroke-[2.5]" />
                              </Button>
                              {idx === routines.length - 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAddRoutine(group.key)}
                                  className="size-5 p-0 text-primary hover:bg-primary/10 rounded cursor-pointer"
                                  title={`Add another ${group.fieldLabel}`}
                                >
                                  <Plus className="size-3.5 stroke-[2.5]" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Field 1: Routine Name in its own single row (Required) */}
                        <FieldRow
                          label="Routine Name"
                          required={!isReadOnly}
                          enrichText={group.description}
                        >
                          <div className="max-w-xs flex-1">
                            <Input
                              disabled={isReadOnly}
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
                                fieldError &&
                                  "border-destructive focus-visible:ring-destructive/30",
                                isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                              )}
                            />
                          </div>
                        </FieldRow>

                        {/* Field 2: Description in its own single row */}
                        <FieldRow
                          label="Description"
                          enrichText="Summary notes or execution conditions for this routine"
                        >
                          <div className="max-w-md flex-1">
                            <Input
                              disabled={isReadOnly}
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
                        </FieldRow>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
