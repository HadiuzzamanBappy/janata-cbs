"use client";

import * as React from "react";
import { validateValues } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/types";

export interface UseFormStateOptions {
  schema: FormConfigRecord | null;
  tabId?: string;
  initialScreenMode?: CbsScreenMode;
  initialRecordId?: string;
  initialValues?: Record<string, unknown>;
}

export function useFormState({
  schema,
  tabId,
  initialScreenMode,
  initialRecordId: initialRecordIdProp,
  initialValues = {},
}: UseFormStateOptions) {
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // Tab-persisted or default mode & ID
  const initialMode = initialScreenMode || currentTab?.screenMode || "IDLE";
  const initialId = initialRecordIdProp || currentTab?.searchRecordId || "";

  // Merged initial values (active tab draft overrides initial seed values)
  const mergedDraft = React.useMemo(() => {
    const draft = (currentTab?.formData as Record<string, unknown>) || {};
    return { ...initialValues, ...draft };
  }, [currentTab?.formData, initialValues]);

  const [screenMode, setScreenModeState] = React.useState<CbsScreenMode>(initialMode);
  const [searchRecordId, setSearchRecordIdState] = React.useState<string>(initialId);
  const [values, setValuesState] = React.useState<Record<string, unknown>>(mergedDraft);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = React.useState<boolean>(false);

  // Synchronize when initial draft seed changes
  React.useEffect(() => {
    setValuesState(mergedDraft);
    setIsDirty(false);
  }, [mergedDraft]);

  const setScreenMode = React.useCallback(
    (mode: CbsScreenMode) => {
      setScreenModeState(mode);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { screenMode: mode });
      }
    },
    [tabId, updateTabState],
  );

  const setSearchRecordId = React.useCallback(
    (id: string) => {
      setSearchRecordIdState(id);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { searchRecordId: id });
      }
    },
    [tabId, updateTabState],
  );

  const setValue = React.useCallback(
    (name: string, val: unknown) => {
      setValuesState((prev) => {
        const next = { ...prev, [name]: val };
        if (tabId && typeof updateFormData === "function") {
          updateFormData(tabId, next);
        }
        return next;
      });
      setIsDirty(true);

      // Clear existing field error
      setErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [tabId, updateFormData],
  );

  const setValues = React.useCallback(
    (nextValues: Record<string, unknown>) => {
      setValuesState(nextValues);
      setIsDirty(false);
      setErrors({});
      if (tabId && typeof updateFormData === "function") {
        updateFormData(tabId, nextValues);
      }
    },
    [tabId, updateFormData],
  );

  const resetForm = React.useCallback(
    (resetValues: Record<string, unknown> = initialValues) => {
      setValuesState(resetValues);
      setErrors({});
      setIsDirty(false);
      if (tabId && typeof updateFormData === "function") {
        updateFormData(tabId, resetValues);
      }
    },
    [tabId, initialValues, updateFormData],
  );

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
    errors,
    isDirty,
    validate,
    resetForm,
  };
}
