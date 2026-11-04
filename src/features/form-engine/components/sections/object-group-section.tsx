import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateClientToken } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { CbsScreenMode } from "@/types";
import { getFieldValue } from "../../utils/path-utils";
import { getFieldColSpanClass } from "../../utils/section-utils";
import { FieldAtom } from "../field-atom";
import { UnifiedFieldFactory } from "../field-factory";

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
  const isBoundArray = Boolean(section.bindKey);
  const groupTitle = section.title || `Group #${groupKey}`;

  // Helper to resolve the data key for a child field in a set
  const resolveFieldKey = (field: FormElement, setIdx: number) => {
    if (isBoundArray) {
      return `${section.bindKey}.${setIdx}.${field.NAME}`;
    }
    return setIdx === 0 ? field.NAME : `${field.NAME}_${setIdx}`;
  };

  const derivedFromValues = (() => {
    if (isBoundArray) {
      const boundArray = getFieldValue(values, section.bindKey ?? "");
      if (Array.isArray(boundArray)) {
        return Math.max(boundArray.length, 1);
      }
    }
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

  const isMulti = section.structure === "M";
  const currentCount = isMulti ? (groupCounts[groupKey] ?? derivedFromValues) : 1;
  const setCount = isMulti ? Math.max(currentCount, 1) : 1;

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
    const uid = generateClientToken("set");

    setGroupCounts((prev) => ({ ...prev, [groupKey]: newCount }));
    onChange(`__group_${groupKey}_count`, newCount);
    onChange(`__group_${groupKey}_uid_${newSetIdx}`, uid);

    for (const f of section.fields) {
      const key = resolveFieldKey(f, newSetIdx);
      onChange(key, "");
    }
  };

  const handleRemoveGroupSet = (removeIdx: number) => {
    if (setCount <= 1) return;
    const newCount = setCount - 1;
    setGroupCounts((prev) => ({ ...prev, [groupKey]: newCount }));
    onChange(`__group_${groupKey}_count`, newCount);

    if (isBoundArray && section.bindKey) {
      const rawList = getFieldValue(values, section.bindKey);
      if (Array.isArray(rawList)) {
        const nextList = rawList.filter((_, idx) => idx !== removeIdx);
        onChange(section.bindKey, nextList);
        return;
      }
    }

    for (let i = removeIdx; i < setCount - 1; i++) {
      const currUidKey = `__group_${groupKey}_uid_${i}`;
      const nextUidKey = `__group_${groupKey}_uid_${i + 1}`;
      onChange(currUidKey, values[nextUidKey] ?? "");

      for (const f of section.fields) {
        const currKey = resolveFieldKey(f, i);
        const nextKey = resolveFieldKey(f, i + 1);
        onChange(currKey, getFieldValue(values, nextKey) ?? "");
      }
    }
    const lastIdx = setCount - 1;
    onChange(`__group_${groupKey}_uid_${lastIdx}`, "");
    for (const f of section.fields) {
      const lastKey = resolveFieldKey(f, lastIdx);
      onChange(lastKey, "");
    }
  };

  return (
    <div className="space-y-2">
      {groupSets.map(({ setIdx, setKey, isLastSet }) => (
        <div key={setKey} className="space-y-2">
          {/* Object Group Header as a Standard Field Row (No input, controls before colon) */}
          <div className="flex items-center gap-2">
            <div className="w-36 shrink-0 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="truncate font-semibold text-foreground text-xs">
                  {isMulti ? `${groupTitle} ${setIdx + 1}` : groupTitle}
                </span>
              </div>

              {!disabled && mode === "I" && isMulti && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {setCount > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveGroupSet(setIdx);
                      }}
                      className="size-5 p-0 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                      title={`Remove ${groupTitle} .${setIdx + 1}`}
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
                        handleAddGroupSet();
                      }}
                      className="size-5 p-0 text-primary hover:bg-primary/10 rounded cursor-pointer"
                      title={`Add another ${groupTitle}`}
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Aligned colon */}
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          </div>

          {/* Child Fields within Group Set */}
          <div className="space-y-2">
            {section.fields.map((field) => {
              const key = resolveFieldKey(field, setIdx);
              const setField: FormElement = {
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
                      value={getFieldValue(values, key)}
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
