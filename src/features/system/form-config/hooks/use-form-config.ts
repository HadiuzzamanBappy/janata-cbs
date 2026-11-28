/**
 * @fileoverview Main state management and command workflow hook for FORM.CONFIG.
 * Coordinates persistence, model schema fetching, validation, operations, and screen lifecycle.
 *
 * @module features/system/form-config/hooks/use-form-config
 */

"use client";

import * as React from "react";
import { toastValidationIssues } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { recordFunctionOfMode } from "@/lib/cbs-access";
import { cbs } from "@/lib/cbs-client";
import { logger } from "@/lib/core-logger";
import { parseGfcResponse } from "@/lib/data-parsers";
import {
  type FormDensity,
  type FormLayout,
  isApiSuccess,
  type ModelConfigRecord,
} from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { type FormConfigValidationError, validateFormConfig } from "./fc-validation";
import { useFcActions } from "./use-fc-actions";
import { useFcFieldOps } from "./use-fc-field-ops";
import { createInitialDraft, useFormConfigPersistence } from "./use-fc-persistence";
import { useFcSectionOps } from "./use-fc-section-ops";

export type { FormConfigValidationError };

/** The form-wide layout settings the designer canvas edits. */
export interface FormRootPatch {
  layout?: FormLayout;
  density?: FormDensity;
}

export function useFormConfig(tabId?: string) {
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
  } = useFormConfigPersistence(tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [targetModelRecord, setTargetModelRecord] = React.useState<ModelConfigRecord | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<FormConfigValidationError[]>([]);
  const [rawRecord, setRawRecord] = React.useState<unknown>(undefined);

  const sectionOps = useFcSectionOps(setFormData, setSelectedSectionId, setSelectedFieldId);
  const fieldOps = useFcFieldOps(setFormData, setSelectedFieldId, setSelectedSectionId);

  // A form ID is `<MODEL>,<VERSION>`: its model key is the part before the comma (never the
  // model's TABLENAME, which can differ, e.g. USER.MGT vs USER_MGT)
  const modelKey = recordId.split(",")[0].trim().toUpperCase();

  const updateFormRoot = React.useCallback(
    (patch: FormRootPatch) => {
      setFormData((prev) => ({
        ...prev,
        frmElements: {
          ...prev.frmElements,
          sections: prev.frmElements?.sections || [],
          ...(patch.layout !== undefined ? { layout: patch.layout } : {}),
          ...(patch.density !== undefined ? { density: patch.density } : {}),
        },
      }));
    },
    [setFormData],
  );

  const initDraft = React.useCallback(
    (cleanId: string) => {
      hydrate(createInitialDraft());
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
      setValidationErrors([]);
      setLoading(true);
      try {
        // Each mode reads the copy it acts on: Authorize reviews the pending layout, not the live one
        const res = await cbs.send<Record<string, unknown>>(
          cbs.formConfig.get(cleanId, { recordFunction: recordFunctionOfMode(targetMode) }),
        );
        // A failed GFC (no such model) already raised its toast in cbs.send; no draft without a model
        if (!isApiSuccess(res) || !res.data) return;

        setRawRecord(res.data);
        const parsed = parseGfcResponse(res.data);
        if (!parsed.success) {
          toast.add({
            title: "Form Config Unreadable",
            description: `Response for #${cleanId} has no model record.`,
            type: "error",
          });
          return;
        }

        const { model, form, isNew, repairs } = parsed.data;
        setTargetModelRecord(model);

        // 1. Existing Form Config: hydrate saved layout into canvas
        if (form) {
          hydrate(form);
          setMode(targetMode);
          setSelectedSectionId(null);
          setSelectedFieldId(null);
          if (repairs.length > 0) {
            logger.warn(`Stored layout #${cleanId} opened with invalid parts dropped`, { repairs });
            toast.add({
              title: "Stored Layout Repaired",
              description: `${repairs.length} invalid part${repairs.length > 1 ? "s were" : " was"} dropped from #${cleanId}. Review the layout and save to store the repaired version.`,
              type: "warning",
            });
          }
          return;
        }

        // A stored layout that fails to parse must never be replaced by a blank draft
        if (!isNew) {
          toast.add({
            title: "Form Config Unreadable",
            description: `Stored layout for #${cleanId} could not be parsed.`,
            type: "error",
          });
          return;
        }

        // 2. New Form Config (FORMCONTROL is {}): a draft in Input, otherwise there is nothing to show
        if (targetMode === CbsRecordFunction.INPUT) {
          initDraft(cleanId);
          return;
        }
        toast.add({
          title: "Form Not Found",
          description: `No stored layout for #${cleanId} in CONFIG.FORM.`,
          type: "error",
        });
      } catch {
        // cbs.send already raised the toast; keep the current draft rather than a blank one
      } finally {
        setLoading(false);
      }
    },
    [hydrate, initDraft, setMode, setRecordId],
  );

  /** Shows the checklist and warns on issues. Returns true when the draft is valid. */
  const runValidation = React.useCallback(() => {
    const issues = validateFormConfig(formData, targetModelRecord);
    setValidationErrors(issues);
    if (issues.length > 0) toastValidationIssues(issues.length);
    return issues.length === 0;
  }, [formData, targetModelRecord]);

  const handleValidate = React.useCallback(() => {
    if (!runValidation()) return;
    toast.add({
      title: "Validation Passed",
      description: "Form layout configuration is completely valid",
      type: "success",
    });
  }, [runValidation]);

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
    validateBeforeSave: runValidation,
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
    modelKey,
    rawRecord,
    updateFormRoot,
    ...sectionOps,
    ...fieldOps,
    ...actions,
    fetchRecord,
    handleValidate,
    resetToIdle,
  };
}
