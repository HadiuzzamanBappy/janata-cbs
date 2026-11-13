import {
  evaluateFieldCondition,
  getFieldColSpanClass,
  getFieldValue,
  getGridColsClass,
} from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { FieldAtom } from "./field-atom";
import { UnifiedFieldFactory } from "./field-factory";

export interface FieldGridProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  numCols: number;
  hasKernel: boolean;
}

export function FieldGrid({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  numCols,
  hasKernel,
}: FieldGridProps) {
  const effectiveCols = numCols || section.columns || 1;
  const isViewMode = mode !== "I";

  return (
    <div
      className={cn(
        "grid gap-x-3 text-xs",
        isViewMode ? "gap-y-1" : "gap-y-2",
        getGridColsClass(effectiveCols),
      )}
    >
      {section.fields.map((field) => {
        // 1. Evaluate reactive visibility & hidden conditions
        if (field.VISIBLE_WHEN && !evaluateFieldCondition(field.VISIBLE_WHEN, values)) {
          return null;
        }
        if (field.HIDDEN_WHEN && evaluateFieldCondition(field.HIDDEN_WHEN, values)) {
          return null;
        }

        // 2. Evaluate reactive disabled condition
        const isFieldDisabled =
          disabled ||
          Boolean(field.DISABLED) ||
          (field.DISABLED_WHEN ? evaluateFieldCondition(field.DISABLED_WHEN, values) : false);

        return (
          <div
            key={field.SN}
            className={getFieldColSpanClass(effectiveCols, field.WIDTH, field.LENGTH, field.TYPE)}
          >
            {hasKernel ? (
              <FieldAtom field={field} disabled={isFieldDisabled} mode={mode} />
            ) : (
              <UnifiedFieldFactory
                field={field}
                value={getFieldValue(values, field.NAME)}
                onChange={onChange}
                error={errors[field.NAME]}
                disabled={isFieldDisabled}
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
  );
}
