/**
 * @fileoverview Isolated Field Atom Subscriber
 * @module form-engine/field-atom
 *
 * Core Invariants:
 * - Subscribes ONLY to its own fieldKey via useFormKernel.
 * - Typing into one field in a 100+ field banking form does NOT re-render sibling FieldAtoms.
 * - Completely eliminates keystroke thrashing.
 */

"use client";

import { useCallback } from "react";
import { getFieldValue } from "@/lib/cbs-form-spec";
import { CBS_PROPERTY_TYPE } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { useFormKernel } from "../../store/form-kernel-provider";
import type { FieldAtomProps } from "../../types";
import { UnifiedFieldFactory } from "./field-factory";

export type { FieldAtomProps };

function ScalarFieldAtom({
  field,
  mode = CbsRecordFunction.INPUT,
  disabled = false,
  labelOverride,
  labelSuffix,
  actionBeforeColon,
}: FieldAtomProps) {
  const fieldKey = field.NAME;

  // Strict selective subscriptions: only this field's slice (zero whole-form re-renders)
  const value = useFormKernel(useCallback((s) => getFieldValue(s.values, fieldKey), [fieldKey]));
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
      disabled={disabled || field.DISABLED || isReadOnly}
      mode={mode}
      labelOverride={labelOverride}
      labelSuffix={labelSuffix}
      actionBeforeColon={actionBeforeColon}
      hasKernel={true}
    />
  );
}

function ObjectFieldAtom({
  field,
  mode = CbsRecordFunction.INPUT,
  disabled = false,
  labelOverride,
  labelSuffix,
  actionBeforeColon,
}: FieldAtomProps) {
  const fieldKey = field.NAME;

  const value = useFormKernel(useCallback((s) => getFieldValue(s.values, fieldKey), [fieldKey]));
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

  const allValues = useFormKernel((s) => s.values);
  const allErrors = useFormKernel((s) => s.errors);

  if (!isVisible) {
    return null;
  }

  return (
    <UnifiedFieldFactory
      field={field}
      value={value}
      onChange={handleChange}
      error={error}
      disabled={disabled || field.DISABLED || isReadOnly}
      mode={mode}
      labelOverride={labelOverride}
      labelSuffix={labelSuffix}
      actionBeforeColon={actionBeforeColon}
      allValues={allValues}
      errors={allErrors}
      hasKernel={true}
    />
  );
}

export function FieldAtom(props: FieldAtomProps) {
  if (props.field.TYPE === CBS_PROPERTY_TYPE.ARRAY) {
    return <ObjectFieldAtom {...props} />;
  }
  return <ScalarFieldAtom {...props} />;
}
