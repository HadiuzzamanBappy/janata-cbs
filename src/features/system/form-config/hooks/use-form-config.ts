"use client";

import * as React from "react";
import { useCbsPersistence } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import {
  type FormConfigRecord,
  formConfigRecordSchema,
} from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { useFcActions } from "./use-fc-actions";
import { useFcCatalog } from "./use-fc-catalog";
import { useFcFieldOps } from "./use-fc-field-ops";
import { useFcModelBinding } from "./use-fc-model-binding";
import { useFcSectionOps } from "./use-fc-section-ops";

export const INITIAL_FORM_CONFIG: FormConfigRecord = {
  recordId: "",
  title: "",
  targetModel: "",
  version: "1.0.0",
  description: "",
  isActive: true,
  presentation: {
    steps: [],
    sections: [],
  },
};

export interface FormConfigValidationError {
  id: string;
  tab: "general" | "designer" | "preview" | "audit" | "json";
  fieldKey: string;
  message: string;
}

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
  } = useCbsPersistence<FormConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_FORM_CONFIG,
    schema: formConfigRecordSchema,
  });

  const { availableForms, availableModels, refreshForms } = useFcCatalog();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<FormConfigValidationError[]>([]);

  const { targetModelRecord, loadingModel, layoutIssues, staleIssues, isStale } = useFcModelBinding(
    formData.targetModel,
    formData,
  );

  const sectionOps = useFcSectionOps(setFormData, setSelectedSectionId, setSelectedFieldId);
  const fieldOps = useFcFieldOps(setFormData, setSelectedFieldId, setSelectedSectionId);

  const fetchRecord = React.useCallback(
    async (id: string, targetMode: CbsScreenMode = "I") => {
      const cleanId = (id || "").trim().toUpperCase();
      if (!cleanId) return;
      setLoading(true);
      try {
        const res = await cbs.send<FormConfigRecord>(cbs.formConfig.get(cleanId));
        if (res.status === "SUCCESS" && res.data) {
          hydrate(res.data);
          setMode(targetMode);
          const firstSec = res.data.presentation?.sections?.[0];
          setSelectedSectionId(firstSec?.id || null);
          setSelectedFieldId(firstSec?.fields?.[0]?.id || null);
        }
      } finally {
        setLoading(false);
      }
    },
    [hydrate, setMode],
  );

  const handleValidate = React.useCallback(() => {
    const issues: FormConfigValidationError[] = [];
    if (!formData.recordId?.trim())
      issues.push({
        id: "id_req",
        tab: "general",
        fieldKey: "recordId",
        message: "Form Code is required",
      });
    if (!formData.title?.trim())
      issues.push({
        id: "title_req",
        tab: "general",
        fieldKey: "title",
        message: "Form Title is required",
      });
    if (!formData.targetModel?.trim())
      issues.push({
        id: "target_req",
        tab: "general",
        fieldKey: "targetModel",
        message: "Target Model is required",
      });

    for (const li of layoutIssues) {
      if (li.severity === "error") {
        issues.push({
          id: `layout_${li.code}_${li.fieldKey || "err"}`,
          tab: "designer",
          fieldKey: li.fieldKey || "presentation",
          message: li.message,
        });
      }
    }

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
  }, [formData, layoutIssues]);

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
    reset();
  }, [reset]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    isDirty,
    loading: loading || loadingModel,
    submitting,
    selectedSectionId,
    setSelectedSectionId,
    selectedFieldId,
    setSelectedFieldId,
    validationErrors,
    targetModelRecord,
    layoutIssues,
    staleIssues,
    isStale,
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
