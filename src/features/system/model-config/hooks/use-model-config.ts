"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { parseModelConfig } from "@/lib/data-parsers";
import {
  type ModelConfigRecord,
  modelConfigRecordSchema,
} from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { type ModelValidationErrorItem, mapZodIssuesToValidationErrors } from "./mc-validation";
import { useMcActions } from "./use-mc-actions";
import { useMcCatalog } from "./use-mc-catalog";
import { INITIAL_MODEL, useModelConfigPersistence } from "./use-mc-persistence";
import { useMcPropertyOps } from "./use-mc-property-ops";

export function useModelConfig(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    hydrate,
    rebaseline,
    reset,
    baseline,
    isDirty,
    dirtyKeys,
    resolvedInitialId,
    resolvedInitialMode,
  } = useModelConfigPersistence(initialId, tabId);

  const { modelsPool, refreshCatalog, upsertCatalogItem } = useMcCatalog();
  const {
    addField,
    addSubField,
    updateField,
    removeField,
    isFieldCommitted,
    markAsCommitted,
    clearCommitted,
  } = useMcPropertyOps(setFormData);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [rawRecord, setRawRecord] = React.useState<ModelConfigRecord | undefined>(undefined);
  const [validationErrors, setValidationErrors] = React.useState<ModelValidationErrorItem[]>([]);

  const resetToIdle = React.useCallback(() => {
    reset();
    clearCommitted();
    setRawRecord(undefined);
    setValidationErrors([]);
  }, [clearCommitted, reset]);

  const initDraft = React.useCallback(
    (cleanId: string) => {
      const draft: ModelConfigRecord = {
        ...INITIAL_MODEL,
        TABLENAME: cleanId.replace(/[.-]/g, "_"),
        DESCRIPTION: "",
      };
      setRawRecord(undefined);
      hydrate(draft);
      clearCommitted();
      setValidationErrors([]);
      setMode(CbsRecordFunction.INPUT);
      toast.add({
        title: "New Model Draft",
        description: `Created new draft schema for #${cleanId}. Complete properties and Save.`,
        type: "info",
      });
    },
    [clearCommitted, hydrate, setMode],
  );

  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: CbsScreenMode = CbsRecordFunction.INPUT) => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);
      setValidationErrors([]);

      try {
        const json = await cbs.send(cbs.modelConfig.get(cleanId));
        if (json.status === "SUCCESS" && json.data) {
          const parsed = parseModelConfig(json.data);
          if (parsed.success) {
            const raw =
              ((json.data as Record<string, unknown>)?.record as ModelConfigRecord) ?? parsed.data;
            setRawRecord(raw);
            hydrate(parsed.data);
            markAsCommitted(parsed.data.PROPERTIES || []);
            setValidationErrors([]);
            setMode(targetMode);
            toast.add({
              title: "Model Loaded",
              description: `Loaded data dictionary for #${cleanId}`,
              type: "success",
            });
            return;
          }
          console.error(`[ModelConfig] parse failed for ${cleanId}:`, parsed.error);
          toast.add({ title: "Model Parse Failed", description: parsed.error, type: "error" });
        }
        if (targetMode === CbsRecordFunction.INPUT) initDraft(cleanId);
      } catch {
        if (targetMode === CbsRecordFunction.INPUT) initDraft(cleanId);
      } finally {
        setLoading(false);
      }
    },
    [hydrate, initDraft, markAsCommitted, setMode, setRecordId],
  );

  const handleValidate = React.useCallback((): boolean => {
    const validation = modelConfigRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errors = mapZodIssuesToValidationErrors(
        validation.error.issues,
        formData.PROPERTIES || [],
      );
      setValidationErrors(errors);
      toast.add({
        title: "Validation Issues Found",
        description: `${errors.length} issue${errors.length > 1 ? "s" : ""} require your attention.`,
        type: "warning",
      });
      return false;
    }
    setValidationErrors([]);
    toast.add({
      title: "Validation Successful",
      description: "All dictionary constraints and required properties verified (✓).",
      type: "success",
    });
    return true;
  }, [formData]);

  const { handleSubmit, handleAuthorize, handleHold, handleDelete, handleReverse } = useMcActions({
    formData,
    recordId,
    setSubmitting,
    setValidationErrors,
    rebaseline,
    resetToIdle,
    markAsCommitted,
    upsertCatalogItem,
    fetchRecord,
  });

  const handleCreateNew = React.useCallback(
    (newId?: string) => {
      const cleanId = (newId || "").trim().toUpperCase();
      if (cleanId) fetchRecord(cleanId, CbsRecordFunction.INPUT);
    },
    [fetchRecord],
  );

  React.useEffect(() => {
    if (mode !== CbsRecordFunction.INPUT) setValidationErrors([]);
  }, [mode]);

  const hasLoadedInitialRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasLoadedInitialRef.current && resolvedInitialId) {
      hasLoadedInitialRef.current = true;
      fetchRecord(resolvedInitialId, resolvedInitialMode);
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
    rawRecord,
    isDirty,
    dirtyKeys,
    modelsPool,
    refreshCatalog,
    loading,
    submitting,
    fetchRecord,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
    validationErrors,
    addField,
    addSubField,
    updateField,
    removeField,
    isFieldCommitted,
    handleCreateNew,
    resetToIdle,
  };
}
