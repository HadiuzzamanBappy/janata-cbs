"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import type { CbsWirePayload } from "@/lib/data-schemas";
import {
  type ModelConfigRecord,
  modelConfigRecordSchema,
  type ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { mapZodIssuesToValidationErrors } from "./mc-validation";
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
    isDirty,
    dirtyKeys,
    resolvedInitialId,
    resolvedInitialMode,
  } = useModelConfigPersistence(initialId, tabId);

  const { modelsPool, refreshCatalog, upsertCatalogItem } = useMcCatalog();
  const { addField, updateField, removeField, isFieldCommitted, markAsCommitted, clearCommitted } =
    useMcPropertyOps(setFormData);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [validationErrors, setValidationErrors] = React.useState<ValidationErrorItem[]>([]);

  // 1. Reset screen and commit set to idle
  const resetToIdle = React.useCallback(() => {
    reset();
    clearCommitted();
    setValidationErrors([]);
  }, [clearCommitted, reset]);

  // 2. Initialize new empty draft
  const initDraft = React.useCallback(
    (cleanId: string) => {
      const draft: ModelConfigRecord = {
        ...INITIAL_MODEL,
        TABLENAME: cleanId.replace(/[.-]/g, "_"),
        DESCRIPTION: cleanId.replace(/[_.-]/g, " "),
      };
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

  // 3. Fetch record from database
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: CbsScreenMode = CbsRecordFunction.INPUT) => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);
      setValidationErrors([]);

      try {
        const json = await cbs.send<{ record?: ModelConfigRecord } | ModelConfigRecord>(
          cbs.modelConfig.get(cleanId),
        );
        const rawData = json.data;
        const record =
          json.status === "SUCCESS" && rawData
            ? ((rawData as { record?: ModelConfigRecord }).record ?? (rawData as ModelConfigRecord))
            : undefined;

        if (record) {
          hydrate(record);
          markAsCommitted(record.PROPERTIES || []);
          setValidationErrors([]);
          setMode(targetMode);
          toast.add({
            title: "Model Loaded",
            description: `Loaded data dictionary for #${cleanId}`,
            type: "success",
          });
          return;
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
    [hydrate, initDraft, markAsCommitted, setMode, setRecordId],
  );

  // 4. Validate against Zod schema
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

  // 5. Generic mutation runner for CBS screen actions
  const executeMutation = React.useCallback(
    async (
      payload: CbsWirePayload,
      options: {
        successTitle: string;
        successMessage: string;
        targetId?: string;
        onSuccess?: () => void | Promise<void>;
      },
    ) => {
      setSubmitting(true);
      try {
        const json = await cbs.send(payload, {
          successTitle: options.successTitle,
          successMessage: options.successMessage,
        });
        if (json.status === "SUCCESS") {
          const syncId = options.targetId || recordId;
          if (syncId) {
            broadcastRecordMutation("MODEL.CONFIG", syncId);
          }
          await options.onSuccess?.();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [recordId],
  );

  // 6. Action Handlers
  const handleSubmit = React.useCallback(async () => {
    const validation = modelConfigRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errors = mapZodIssuesToValidationErrors(
        validation.error.issues,
        formData.PROPERTIES || [],
      );
      setValidationErrors(errors);
      toast.add({
        title: "Validation Issues Found",
        description: `${errors.length} issue${errors.length > 1 ? "s" : ""} require your attention before saving.`,
        type: "warning",
      });
      return;
    }

    setValidationErrors([]);
    const targetId = recordId || formData.TABLENAME || validation.data.TABLENAME || "";
    await executeMutation(
      cbs.modelConfig.save(validation.data as unknown as Record<string, unknown>, {
        recordId: targetId,
      }),
      {
        targetId,
        successTitle: "Model Saved",
        successMessage: `Saved schema #${targetId} to MODEL.CONFIG`,
        onSuccess: () => {
          rebaseline();
          markAsCommitted(validation.data.PROPERTIES || []);
          upsertCatalogItem({
            id: targetId,
            label: validation.data.DESCRIPTION,
            details: `${validation.data.PROPERTIES.length} properties`,
            record: validation.data,
          });
          resetToIdle();
        },
      },
    );
  }, [
    executeMutation,
    formData,
    markAsCommitted,
    rebaseline,
    recordId,
    resetToIdle,
    upsertCatalogItem,
  ]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.modelConfig.authorize(recordId), {
      successTitle: "Model Authorized",
      successMessage: `Authorized live model #${recordId}`,
      onSuccess: () => resetToIdle(),
    });
  }, [executeMutation, recordId, resetToIdle]);

  const handleHold = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.modelConfig.hold(recordId), {
      successTitle: "Model Placed on Hold",
      successMessage: `Record #${recordId} set to HLD status`,
      onSuccess: () => fetchRecord(recordId, CbsRecordFunction.HOLD),
    });
  }, [executeMutation, fetchRecord, recordId]);

  const handleDelete = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.modelConfig.delete(recordId), {
      successTitle: "Model Deleted",
      successMessage: `Pending model #${recordId} has been removed`,
      onSuccess: () => resetToIdle(),
    });
  }, [executeMutation, recordId, resetToIdle]);

  const handleReverse = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.modelConfig.reverse(recordId), {
      successTitle: "Model Reversed",
      successMessage: `Live model #${recordId} status reverted`,
      onSuccess: () => fetchRecord(recordId, CbsRecordFunction.REVERSE),
    });
  }, [executeMutation, fetchRecord, recordId]);

  const handleCreateNew = React.useCallback(
    (newId?: string) => {
      const cleanId = (newId || "").trim().toUpperCase();
      if (cleanId) {
        fetchRecord(cleanId, CbsRecordFunction.INPUT);
      }
    },
    [fetchRecord],
  );

  // Clear validation errors when switching away from edit mode
  React.useEffect(() => {
    if (mode !== CbsRecordFunction.INPUT) {
      setValidationErrors([]);
    }
  }, [mode]);

  // Auto-load initial record once if deep-linked or restored
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
    clearValidationErrors: () => setValidationErrors([]),
    addField,
    updateField,
    removeField,
    isFieldCommitted,
    handleCreateNew,
    resetToIdle,
  };
}
