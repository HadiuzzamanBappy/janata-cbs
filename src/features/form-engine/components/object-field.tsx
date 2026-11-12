"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getFieldColSpanClass, getFieldValue } from "@/lib/cbs-form-spec";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { CbsScreenMode } from "@/types";
import { FieldAtom } from "./field-atom";
import { UnifiedFieldFactory } from "./field-factory";
import { useFormLayout } from "./form-layout-context";

export interface ObjectFieldProps {
  field: FormElement;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  hasKernel?: boolean;
}

export function ObjectField({
  field,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  hasKernel = false,
}: ObjectFieldProps) {
  const { layout } = useFormLayout();
  const isStacked = layout === "stacked";

  const isMulti = field.STRUCTURE === "M";
  const groupKey = field.NAME;
  const label = field.LABEL || field.NAME;
  const isInputMode = mode === "I";
  const isReadOnly = disabled || !isInputMode;
  const subFields = (field.PROP || field.children || []) as FormElement[];

  // Retrieve array value using pure dot-path accessor
  const currentArray = useMemo(() => {
    if (!isMulti) return [];
    const val = getFieldValue(values, groupKey);
    if (Array.isArray(val)) {
      return val.length > 0 ? val : [{}];
    }
    return [{}];
  }, [isMulti, values, groupKey]);

  const setCount = isMulti ? Math.max(currentArray.length, 1) : 1;

  const handleAddSet = useCallback(() => {
    const nextArr = [...currentArray, {}];
    onChange(groupKey, nextArr);
  }, [currentArray, groupKey, onChange]);

  const handleRemoveSet = useCallback(
    (removeIdx: number) => {
      if (setCount <= 1) return;
      const nextArr = currentArray.filter((_, idx) => idx !== removeIdx);
      onChange(groupKey, nextArr.length > 0 ? nextArr : [{}]);
    },
    [setCount, currentArray, groupKey, onChange],
  );

  const setEntries = useMemo(() => {
    return Array.from({ length: setCount }, (_, setIdx) => {
      const entryId = `${groupKey}_set_${setIdx + 1}`;
      return { setIdx, entryId };
    });
  }, [setCount, groupKey]);

  // Single Object Mode (S): Renders sub-fields bound to `${groupKey}.${child.NAME}`
  if (!isMulti) {
    return (
      <div className="space-y-1.5 w-full">
        {/* Group Header Row */}
        <div
          className={
            isStacked
              ? "flex items-center justify-between w-full pb-0.5"
              : "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
          }
        >
          <div
            className={
              isStacked
                ? "w-full flex items-center justify-between text-xs select-none"
                : "w-full sm:w-36 shrink-0 flex items-center justify-between text-xs select-none"
            }
          >
            <span className="truncate font-semibold text-foreground text-xs">{label}</span>
          </div>
          {!isStacked && (
            <span className="hidden sm:inline-block text-muted-foreground/60 font-mono text-xs shrink-0 select-none">
              :
            </span>
          )}
        </div>

        {/* Sub-Fields */}
        <div className="space-y-2">
          {subFields.map((child) => {
            const fieldPath = `${groupKey}.${child.NAME}`;
            const boundChild: FormElement = {
              ...child,
              NAME: fieldPath,
            };

            return (
              <div
                key={child.SN || child.NAME}
                className={getFieldColSpanClass(1, child.WIDTH, child.LENGTH, child.TYPE)}
              >
                {hasKernel ? (
                  <FieldAtom field={boundChild} disabled={isReadOnly} mode={mode} />
                ) : (
                  <UnifiedFieldFactory
                    field={boundChild}
                    value={getFieldValue(values, fieldPath)}
                    onChange={onChange}
                    error={errors[fieldPath]}
                    disabled={isReadOnly}
                    mode={mode}
                    allValues={values}
                    errors={errors}
                    hasKernel={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Multi-Value Mode (M): High-density repeating inline sets
  return (
    <div className="space-y-2 w-full">
      {setEntries.map(({ setIdx, entryId }) => {
        const isLastSet = setIdx === setCount - 1;

        return (
          <div key={entryId} className="space-y-1.5">
            {/* Inline Group Header: Label + [ - ] [ + ] */}
            <div
              className={
                isStacked
                  ? "flex items-center justify-between w-full pb-0.5"
                  : "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
              }
            >
              <div
                className={
                  isStacked
                    ? "w-full flex items-center justify-between text-xs select-none"
                    : "w-full sm:w-36 shrink-0 flex items-center justify-between text-xs select-none"
                }
              >
                <span className="truncate font-semibold text-foreground text-xs">
                  {label} {setIdx + 1}
                </span>

                {!isReadOnly && (
                  <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                    {setCount > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveSet(setIdx);
                        }}
                        className="size-5 p-0 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                        title={`Remove ${label} ${setIdx + 1}`}
                      >
                        <Minus className="size-3.5 stroke-[2.5]" />
                      </Button>
                    )}
                    {isLastSet && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddSet();
                        }}
                        className="size-5 p-0 text-primary hover:bg-primary/10 rounded cursor-pointer"
                        title={`Add another ${label}`}
                      >
                        <Plus className="size-3.5 stroke-[2.5]" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {!isStacked && (
                <span className="hidden sm:inline-block text-muted-foreground/60 font-mono text-xs shrink-0 select-none">
                  :
                </span>
              )}
            </div>

            {/* Sub-Fields for this Set */}
            <div className="space-y-2">
              {subFields.map((child) => {
                const fieldPath = `${groupKey}.${setIdx}.${child.NAME}`;
                const boundChild: FormElement = {
                  ...child,
                  SN: `${child.SN}_${setIdx}`,
                  NAME: fieldPath,
                };

                return (
                  <div
                    key={boundChild.SN || boundChild.NAME}
                    className={getFieldColSpanClass(1, child.WIDTH, child.LENGTH, child.TYPE)}
                  >
                    {hasKernel ? (
                      <FieldAtom field={boundChild} disabled={isReadOnly} mode={mode} />
                    ) : (
                      <UnifiedFieldFactory
                        field={boundChild}
                        value={getFieldValue(values, fieldPath)}
                        onChange={onChange}
                        error={errors[fieldPath]}
                        disabled={isReadOnly}
                        mode={mode}
                        allValues={values}
                        errors={errors}
                        hasKernel={false}
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
}
