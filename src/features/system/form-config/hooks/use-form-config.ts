/**
 * @fileoverview Main state management and command workflow hook for FORM.CONFIG.
 * Coordinates persistence, model schema fetching, validation, operations, and screen lifecycle.
 *
 * @module features/system/form-config/hooks/use-form-config
 */

"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { parseGfcResponse } from "@/lib/data-parsers";
import type { ModelConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { type FormConfigValidationError, validateFormConfig } from "./fc-validation";
import { useFcActions } from "./use-fc-actions";
import { useFcFieldOps } from "./use-fc-field-ops";
import {
  createInitialDraft,
  INITIAL_FORM_CONFIG,
  useFormConfigPersistence,
} from "./use-fc-persistence";
import { useFcSectionOps } from "./use-fc-section-ops";

export type { FormConfigValidationError };
export { INITIAL_FORM_CONFIG };

export function useFormConfig(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    baseline,
    isDirty,
    hydrate,
    rebaseline,
    reset,
    resolvedInitialId,
    resolvedInitialMode,
  } = useFormConfigPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<FormConfigValidationError[]>([]);
  const [targetModelRecord, setTargetModelRecord] = React.useState<ModelConfigRecord | null>(null);
  const [rawRecord, setRawRecord] = React.useState<unknown>(undefined);

  const sectionOps = useFcSectionOps(setFormData, setSelectedSectionId, setSelectedFieldId);
  const fieldOps = useFcFieldOps(setFormData, setSelectedFieldId, setSelectedSectionId);

  const initDraft = React.useCallback(
    (cleanId: string) => {
      const draft = createInitialDraft(cleanId);
      hydrate(draft);
      setMode(CbsRecordFunction.INPUT);
      setSelectedSectionId(null);
      setSelectedFieldId(null);
      toast.add({
        title: "New Form Config Draft",
        description: `Initialized clean layout draft for #${cleanId}.`,
        type: "info",
      });
    },
    [hydrate, setMode],
  );

  const fetchRecord = React.useCallback(
    async (id: string, targetMode: CbsScreenMode = CbsRecordFunction.INPUT) => {
      const cleanId = (id || "").trim().toUpperCase();
      if (!cleanId) return;
      setRecordId(cleanId);
      setLoading(true);
      try {
        const res = await cbs.send<Record<string, unknown>>(cbs.formConfig.get(cleanId));
        if (res.status === "SUCCESS" && res.data) {
          setRawRecord(res.data);
          const parsed = parseGfcResponse(res.data);
          if (parsed.success) {
            const { model, form, isNew } = parsed.data;
            setTargetModelRecord(model);

            // 1. Existing Form Config: hydrate saved layout into canvas
            if (!isNew && form) {
              hydrate(form);
              setMode(targetMode);
              setSelectedSectionId(null);
              setSelectedFieldId(null);
              return;
            }

            // 2. New Form Config (FORMCONTROL is {}): initialize clean empty draft
            if (targetMode === CbsRecordFunction.INPUT) {
              initDraft(cleanId);
              return;
            }
          }
        }

        if (targetMode === CbsRecordFunction.INPUT) {
          initDraft(cleanId);
        }
      } catch {
        if (targetMode === CbsRecordFunction.INPUT) {
          initDraft(cleanId);
        }
      } finally {
        setLoading(false);
      }
    },
    [hydrate, initDraft, setMode, setRecordId],
  );

  const handleValidate = React.useCallback(() => {
    const issues = validateFormConfig(formData);
    setValidationErrors(issues);
    if (issues.length > 0) {
      toast.add({
        title: "Validation Failed",
        description: `${issues.length} issue(s) detected`,
        type: "warning",
      });
      return false;
    }
    toast.add({
      title: "Validation Passed",
      description: "Form layout configuration is completely valid",
      type: "success",
    });
    return true;
  }, [formData]);

  const resetToIdle = React.useCallback(() => {
    setSelectedSectionId(null);
    setSelectedFieldId(null);
    setValidationErrors([]);
    setTargetModelRecord(null);
    setRawRecord(undefined);
    reset();
  }, [reset]);

  const actions = useFcActions({
    formData,
    recordId,
    handleValidate,
    rebaseline,
    reset,
    resetToIdle,
    setSubmitting,
  });

  // Only auto-fetch when an explicit initial ID was supplied via navigation command / deep-link
  const hasLoadedInitialRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasLoadedInitialRef.current && resolvedInitialId) {
      hasLoadedInitialRef.current = true;
      fetchRecord(resolvedInitialId, resolvedInitialMode || CbsRecordFunction.INPUT);
    }
  }, [fetchRecord, resolvedInitialId, resolvedInitialMode]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    baseline,
    isDirty,
    loading,
    submitting,
    selectedSectionId,
    setSelectedSectionId,
    selectedFieldId,
    setSelectedFieldId,
    validationErrors,
    targetModelRecord,
    rawRecord,
    ...sectionOps,
    ...fieldOps,
    ...actions,
    fetchRecord,
    handleValidate,
    resetToIdle,
  };
}
