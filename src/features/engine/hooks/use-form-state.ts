"use client";

import { useState, useCallback, useEffect } from "react";
import { type FormSchema } from "@/lib/schema/schemas";

export function useFormState(
  schema: FormSchema | null,
  initialData: Record<string, any> = {}
) {
  const [values, setValues] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    setValues(initialData);
    setIsDirty(false);
    setErrors({});
  }, [initialData]);

  const setValue = useCallback((name: string, val: any) => {
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
    if (!schema) return true;

    const newErrors: Record<string, string> = {};
    for (const field of schema.fields) {
      if (field.required) {
        const val = values[field.name];
        if (val === undefined || val === null || val === "") {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema, values]);

  const resetForm = useCallback(
    (newValues: Record<string, any> = {}) => {
      setValues(newValues);
      setErrors({});
      setIsDirty(false);
    },
    []
  );

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
