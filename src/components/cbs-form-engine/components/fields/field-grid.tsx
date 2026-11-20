/**
 * @fileoverview High-Density Section Field Grid Component
 * @module form-engine/field-grid
 *
 * Core Invariants:
 * - Arranges section fields across responsive Tailwind multi-column layouts.
 * - Evaluates reactive visibility (VISIBLE_WHEN) and disabled conditions (DISABLED_WHEN, DISABLED, FIXEDVALUE).
 * - Delegates grid classes and cell spans to getGridColsClass and getFieldColSpanClass.
 */

import {
  evaluateFieldCondition,
  getFieldColSpanClass,
  getFieldValue,
  getGridColsClass,
} from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { UnifiedFieldFactory } from "./field-factory";

export interface FieldGridProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  numCols: number;
}

export function FieldGrid({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = CbsRecordFunction.INPUT,
  numCols,
}: FieldGridProps) {
  const effectiveCols = numCols || section.columns || 1;
  const isViewMode = mode !== CbsRecordFunction.INPUT;

  return (
    <div
      className={cn(
        "grid gap-x-3 text-xs",
        isViewMode ? "gap-y-1" : "gap-y-2",
        getGridColsClass(effectiveCols),
      )}
    >
      {section.fields.map((field, idx) => {
        // 1. Evaluate reactive visibility
        if (field.VISIBLE_WHEN && !evaluateFieldCondition(field.VISIBLE_WHEN, values)) {
          return null;
        }

        // 2. Evaluate reactive disabled condition (a fixed value is never editable)
        const isFieldDisabled =
          disabled ||
          Boolean(field.DISABLED) ||
          Boolean(field.FIXEDVALUE) ||
          (field.DISABLED_WHEN ? evaluateFieldCondition(field.DISABLED_WHEN, values) : false);

        return (
          <div
            key={field.NAME || `${field.SN || "field"}-${idx}`}
            className={getFieldColSpanClass(effectiveCols, field.WIDTH, field.LENGTH, field.TYPE)}
          >
            <UnifiedFieldFactory
              field={field}
              value={getFieldValue(values, field.NAME)}
              onChange={onChange}
              error={errors[field.NAME]}
              disabled={isFieldDisabled}
              mode={mode}
              allValues={values}
              errors={errors}
            />
          </div>
        );
      })}
    </div>
  );
}
