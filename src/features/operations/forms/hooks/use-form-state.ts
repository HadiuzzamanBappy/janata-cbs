"use client";

import { useCallback, useEffect, useState } from "react";
import { validateValues } from "@/lib/cbs-form-spec";
import type { CompiledFormSpec } from "@/lib/data-schemas";

export function useFormState(
  spec: CompiledFormSpec | null,
  initialData: Record<string, unknown> = {},
) {
  const [values, setValues] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    setValues(initialData);
    setIsDirty(false);
    setErrors({});
  }, [initialData]);

  const setValue = useCallback((name: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [name]: val }));
    setIsDirty(true);

    // Clear error on change
    setErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return prev;
    });
  }, []);

  const validate = useCallback((): boolean => {
    if (!spec) return true;

    // Use pure cbs-form-spec rule validation engine
    const validationErrors = validateValues(spec, values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [spec, values]);

  const resetForm = useCallback((newValues: Record<string, unknown> = {}) => {
    setValues(newValues);
    setErrors({});
    setIsDirty(false);
  }, []);

  return {
    values,
    errors,
    isDirty,
    setValue,
    validate,
    resetForm,
    setValues,
  };
}
