"use client";

import * as React from "react";
import { toastValidationIssues, useCbsPersistence } from "@/components/cbs-screen";
import { setFieldValue, validateValues } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas";

/** An empty record: a new entry starts from it, and it is the baseline of a new entry. */
const EMPTY_RECORD: Record<string, unknown> = {};

export interface UseFormStateOptions {
  schema: FormConfigRecord | null;
  tabId?: string;
}

/**
 * High-performance banking form state coordinator.
 * Delegates tab persistence, baseline snapshots, and dirty tracking strictly
 * to the centralized `useCbsPersistence` engine (@/components/cbs-screen).
 *
 * The baseline is the record as loaded (or empty for a new entry): a save sends only what differs
 * from it, so every operation that changes which record is on screen resets it too.
 */
export function useFormState({ schema, tabId }: UseFormStateOptions) {
  const {
    recordId: searchRecordId,
    setRecordId: setSearchRecordId,
    mode: screenMode,
    setMode: setScreenMode,
    formData: values,
    setFormData: setValuesState,
    baseline,
    rebaseline,
    hydrate: hydrateRecord,
    reset,
    isDirty,
  } = useCbsPersistence<Record<string, unknown>>({
    tabId,
    initialData: EMPTY_RECORD,
    ignoredKeys: ["auditData"],
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Single field mutation (keystroke draft). The key may be a path (an object group's inner field
  // `nominees.0.name`, a cascade target): it updates the nested value, never a flat dotted key.
  const setValue = React.useCallback(
    (name: string, val: unknown) => {
      setValuesState((prev) => setFieldValue(prev, name, val));

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

  // Bulk values replace on the same record (paste): the baseline stays the loaded record
  const setValues = React.useCallback(
    (nextValues: Record<string, unknown>) => {
      setValuesState(nextValues);
      setErrors({});
    },
    [setValuesState],
  );

  /** A record loaded from the core: it becomes both the values and the baseline. */
  const hydrate = React.useCallback(
    (record: Record<string, unknown>) => {
      hydrateRecord(record);
      setErrors({});
    },
    [hydrateRecord],
  );

  /** Back to idle with an empty record and an empty baseline (after a save, or Return). */
  const clearForm = React.useCallback(() => {
    reset();
    setErrors({});
  }, [reset]);

  /** Reset: drop the edits, back to the record as loaded (empty for a new entry). */
  const revertForm = React.useCallback(() => {
    setValuesState(structuredClone(baseline));
    setErrors({});
  }, [baseline, setValuesState]);

  /** Runtime validation (`@/lib/cbs-form-spec`); issues show on the fields and in one warning. */
  const validate = React.useCallback((): boolean => {
    if (!schema) return true;
    const validationErrors = validateValues(schema, values);
    setErrors(validationErrors);
    const issueCount = Object.keys(validationErrors).length;
    if (issueCount > 0) toastValidationIssues(issueCount);
    return issueCount === 0;
  }, [schema, values]);

  return {
    screenMode,
    setScreenMode,
    searchRecordId,
    setSearchRecordId,
    values,
    setValue,
    setValues,
    hydrate,
    baseline,
    rebaseline,
    errors,
    isDirty,
    validate,
    clearForm,
    revertForm,
  };
}
