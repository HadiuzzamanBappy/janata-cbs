"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { parseGfcResponse } from "@/lib/data-parsers";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import type { CbsScreenMode } from "@/types";
import { type FormConfigValidationError, validateFormConfig } from "./fc-validation";
import { useFcActions } from "./use-fc-actions";
import { useFcCatalog } from "./use-fc-catalog";
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
    isDirty,
    hydrate,
    rebaseline,
    reset,
  } = useFormConfigPersistence(initialId, tabId);

  const { availableForms, availableModels, refreshForms } = useFcCatalog();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<FormConfigValidationError[]>([]);
  const [targetModelRecord, setTargetModelRecord] = React.useState<ModelConfigRecord | null>(null);

  const sectionOps = useFcSectionOps(setFormData, setSelectedSectionId, setSelectedFieldId);
  const fieldOps = useFcFieldOps(setFormData, setSelectedFieldId, setSelectedSectionId);

  const fetchRecord = React.useCallback(
    async (id: string, targetMode: CbsScreenMode = "I") => {
      const cleanId = (id || "").trim().toUpperCase();
      if (!cleanId) return;
      setRecordId(cleanId);
      setLoading(true);
      try {
        const res = await cbs.send<Record<string, unknown>>(cbs.formConfig.get(cleanId));
        if (res.status === "SUCCESS" && res.data) {
          const parsed = parseGfcResponse(res.data);
          if (parsed.success) {
            const { model, form, isNew } = parsed.data;
            setTargetModelRecord(model);

            // 1. Existing Form Config: hydrate saved layout into canvas
            if (!isNew && form) {
              hydrate(form);
              setMode(targetMode);
              const firstSec = form.frmElements?.sections?.[0];
              setSelectedSectionId(firstSec?.id || null);
              const firstField = firstSec?.fields?.[0];
              setSelectedFieldId(firstField?.SN || firstField?.NAME || null);
              return;
            }

            // 2. New Form Config (FORMCONTROL is {}): initialize 1-col draft
            if (targetMode === "I") {
              const draft = createInitialDraft(cleanId, model.DESCRIPTION);
              hydrate(draft);
              setMode("I");
              setSelectedSectionId("general_sec");
              toast.add({
                title: "New Form Config Draft",
                description: `Initialized layout draft for #${cleanId}.`,
                type: "info",
              });
              return;
            }
          }
        }

        if (targetMode === "I") {
          const draft = createInitialDraft(cleanId);
          hydrate(draft);
          setMode("I");
          setSelectedSectionId("general_sec");
          toast.add({
            title: "New Form Config Draft",
            description: `Initialized layout draft for #${cleanId}.`,
            type: "info",
          });
        }
      } catch {
        if (targetMode === "I") {
          const draft = createInitialDraft(cleanId);
          hydrate(draft);
          setMode("I");
          setSelectedSectionId("general_sec");
          toast.add({
            title: "New Form Config Draft",
            description: `Initialized layout draft for #${cleanId}.`,
            type: "info",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [hydrate, setMode, setRecordId],
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

  const actions = useFcActions({
    formData,
    recordId,
    handleValidate,
    rebaseline,
    reset,
    refreshForms,
    setSubmitting,
  });

  const resetToIdle = React.useCallback(() => {
    setSelectedSectionId(null);
    setSelectedFieldId(null);
    setValidationErrors([]);
    setTargetModelRecord(null);
    reset();
  }, [reset]);

  const hasLoadedInitialRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasLoadedInitialRef.current && initialId) {
      hasLoadedInitialRef.current = true;
      fetchRecord(initialId, "I");
    }
  }, [fetchRecord, initialId]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    isDirty,
    loading,
    submitting,
    selectedSectionId,
    setSelectedSectionId,
    selectedFieldId,
    setSelectedFieldId,
    validationErrors,
    targetModelRecord,
    availableForms,
    availableModels,
    ...sectionOps,
    ...fieldOps,
    ...actions,
    fetchRecord,
    handleValidate,
    resetToIdle,
  };
}
