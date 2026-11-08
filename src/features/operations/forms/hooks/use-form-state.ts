"use client";

import * as React from "react";
import { useCbsPersistence } from "@/components/cbs-screen";
import { validateValues } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";

export interface UseFormStateOptions {
  schema: FormConfigRecord | null;
  tabId?: string;
  initialScreenMode?: CbsScreenMode;
  initialRecordId?: string;
  initialValues?: Record<string, unknown>;
}

/**
 * High-performance banking form state coordinator.
 * Delegates tab persistence, baseline snapshots, and dirty tracking strictly
 * to the centralized `useCbsPersistence` engine (@/components/cbs-screen).
 */
export function useFormState({
  schema,
  tabId,
  initialScreenMode,
  initialRecordId,
  initialValues = {},
}: UseFormStateOptions) {
  const {
    recordId: searchRecordId,
    setRecordId: setSearchRecordId,
    mode: screenMode,
    setMode: setScreenMode,
    formData: values,
    setFormData: setValuesState,
    baseline,
    rebaseline,
    reset,
    isDirty,
  } = useCbsPersistence<Record<string, unknown>>({
    initialId: initialRecordId,
    tabId,
    initialData: initialValues,
    fallbackMode: initialScreenMode || "IDLE",
    ignoredKeys: ["auditData"],
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Single field mutation (keystroke draft)
  const setValue = React.useCallback(
    (name: string, val: unknown) => {
      setValuesState((prev) => ({
        ...prev,
        [name]: val,
      }));

      // Clear field-level error upon user edit
      setErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [setValuesState],
  );

  // Bulk values replace (e.g. record loaded from backend)
  const setValues = React.useCallback(
    (nextValues: Record<string, unknown>) => {
      setValuesState(nextValues);
      setErrors({});
    },
    [setValuesState],
  );

  // Reset form back to baseline or new values
  const resetForm = React.useCallback(
    (resetValues?: Record<string, unknown>) => {
      if (resetValues) {
        setValuesState(resetValues);
      } else {
        reset();
      }
      setErrors({});
    },
    [reset, setValuesState],
  );

  // Runtime headless validation via centralized @/lib/cbs-form-spec
  const validate = React.useCallback((): boolean => {
    if (!schema) return true;
    const validationErrors = validateValues(schema, values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [schema, values]);

  return {
    screenMode,
    setScreenMode,
    searchRecordId,
    setSearchRecordId,
    values,
    setValue,
    setValues,
    baseline,
    rebaseline,
    errors,
    isDirty,
    validate,
    resetForm,
  };
}
