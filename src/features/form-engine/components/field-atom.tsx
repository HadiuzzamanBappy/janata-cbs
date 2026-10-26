"use client";

import { useCallback } from "react";
import type { FormFieldItem } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { useFormKernel } from "../store/form-kernel-provider";
import { UnifiedFieldFactory } from "./field-factory";

export interface FieldAtomProps {
  field: FormFieldItem;
  mode?: CbsScreenMode;
  disabled?: boolean;
  labelOverride?: string;
  labelSuffix?: React.ReactNode;
  actionBeforeColon?: React.ReactNode;
}

/**
 * Isolated Field Atom Subscriber
 *
 * Subscribes ONLY to its own fieldKey.
 * When other fields in the 150 - 1,000 field form mutate, this component DOES NOT re-render.
 */
export function FieldAtom({
  field,
  mode = "I",
  disabled = false,
  labelOverride,
  labelSuffix,
  actionBeforeColon,
}: FieldAtomProps) {
  const fieldKey = field.fieldKey;

  // Selective subscriptions
  const value = useFormKernel(useCallback((s) => s.values[fieldKey], [fieldKey]));
  const error = useFormKernel(useCallback((s) => s.errors[fieldKey], [fieldKey]));
  const isVisible = useFormKernel(useCallback((s) => s.visibility[fieldKey] ?? true, [fieldKey]));
  const isReadOnly = useFormKernel(useCallback((s) => s.readOnly[fieldKey] ?? false, [fieldKey]));
  const setValue = useFormKernel((s) => s.setValue);

  const handleChange = useCallback(
    (_key: string, val: unknown) => {
      setValue(fieldKey, val);
    },
    [setValue, fieldKey],
  );

  if (!isVisible) {
    return null;
  }

  return (
    <UnifiedFieldFactory
      field={field}
      value={value}
      onChange={handleChange}
      error={error}
      disabled={disabled || isReadOnly}
      mode={mode}
      labelOverride={labelOverride}
      labelSuffix={labelSuffix}
      actionBeforeColon={actionBeforeColon}
    />
  );
}
