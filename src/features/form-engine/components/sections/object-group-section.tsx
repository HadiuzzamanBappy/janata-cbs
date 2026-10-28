import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormFieldItem, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { FieldAtom } from "../field-atom";
import { UnifiedFieldFactory } from "../field-factory";
import { getFieldColSpanClass, getGridColsClass } from "./section-utils";

export interface ObjectGroupSectionProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  numCols: number;
  hasKernel: boolean;
}

export function ObjectGroupSection({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  numCols,
  hasKernel,
}: ObjectGroupSectionProps) {
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const groupKey = section.bindKey || section.id;
  const groupTitle = section.title || `Group #${groupKey}`;

  const derivedFromValues = (() => {
    if (values[`__group_${groupKey}_count`] !== undefined) {
      return Number(values[`__group_${groupKey}_count`]) || 1;
    }
    let maxIdx = 0;
    for (let i = 1; i < 50; i++) {
      const hasVal = section.fields.some((f) => {
        const k = `${f.NAME}_${i}`;
        return values[k] !== undefined && values[k] !== null && values[k] !== "";
      });
      if (hasVal) maxIdx = i;
    }
    return maxIdx + 1;
  })();

  const currentCount = groupCounts[groupKey] ?? derivedFromValues;
  const setCount = Math.max(currentCount, 1);

  const groupSets = Array.from({ length: setCount }, (_, setIdx) => {
    const setIdentityKey =
      setIdx === 0
        ? "first"
        : String(values[`__group_${groupKey}_uid_${setIdx}`] || `idx_${setIdx}`);
    return {
      setIdx,
      setKey: `grp_${groupKey}_${setIdentityKey}`,
      isLastSet: setIdx === setCount - 1,
    };
  });

  const handleAddGroupSet = () => {
    const newCount = setCount + 1;
    const newSetIdx = setCount;
    const uid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `set_${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setGroupCounts((prev) => ({ ...prev, [groupKey]: newCount }));
    onChange(`__group_${groupKey}_count`, newCount);
    onChange(`__group_${groupKey}_uid_${newSetIdx}`, uid);

    for (const f of section.fields) {
      const keyWithSuffix = `${f.NAME}_${newSetIdx}`;
      onChange(keyWithSuffix, "");
    }
  };

  const handleRemoveGroupSet = (removeIdx: number) => {
    if (setCount <= 1) return;
    const newCount = setCount - 1;
    setGroupCounts((prev) => ({ ...prev, [groupKey]: newCount }));
    onChange(`__group_${groupKey}_count`, newCount);

    for (let i = removeIdx; i < setCount - 1; i++) {
      const currUidKey = `__group_${groupKey}_uid_${i}`;
      const nextUidKey = `__group_${groupKey}_uid_${i + 1}`;
      onChange(currUidKey, values[nextUidKey] ?? "");

      for (const f of section.fields) {
        const currKey = i === 0 ? f.NAME : `${f.NAME}_${i}`;
        const nextKey = `${f.NAME}_${i + 1}`;
        onChange(currKey, values[nextKey] ?? "");
      }
    }
    const lastIdx = setCount - 1;
    onChange(`__group_${groupKey}_uid_${lastIdx}`, "");
    for (const f of section.fields) {
      const lastKey = lastIdx === 0 ? f.NAME : `${f.NAME}_${lastIdx}`;
      onChange(lastKey, "");
    }
  };

  return (
    <div className="space-y-2.5 my-1">
      {groupSets.map(({ setIdx, setKey, isLastSet }) => (
        <div
          key={setKey}
          className="rounded border border-border/80 bg-muted/15 p-2.5 shadow-2xs space-y-2.5 transition-colors"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                #{groupKey}
              </span>
              <span className="text-xs font-semibold text-foreground tracking-tight">
                {groupTitle} #{setIdx + 1}
              </span>
            </div>

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

          <div className={cn("grid gap-x-4 gap-y-2 text-xs", getGridColsClass(numCols))}>
            {section.fields.map((field) => {
              const key = setIdx === 0 ? field.NAME : `${field.NAME}_${setIdx}`;
              const setField: FormFieldItem = {
                ...field,
                SN: `${field.SN}_set_${setIdx}`,
                NAME: key,
              };

              return (
                <div key={setField.SN} className={getFieldColSpanClass(numCols, setField.WIDTH)}>
                  {hasKernel ? (
                    <FieldAtom field={setField} disabled={disabled} mode={mode} />
                  ) : (
                    <UnifiedFieldFactory
                      field={setField}
                      value={values[key]}
                      onChange={onChange}
                      error={errors[key]}
                      disabled={disabled}
                      mode={mode}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
