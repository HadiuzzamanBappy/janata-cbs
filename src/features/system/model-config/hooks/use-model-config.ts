"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";

import {
  type ModelConfigRecord,
  modelConfigRecordSchema,
  type ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { mapZodIssuesToValidationErrors } from "./mc-validation";
import { useMcCatalog } from "./use-mc-catalog";
import { INITIAL_MODEL, useModelConfigPersistence } from "./use-mc-persistence";
import { useMcTreeOps } from "./use-mc-tree-ops";

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
  const {
    addField,
    addChildField,
    updateField,
    removeField,
    isFieldCommitted,
    markAsCommitted,
    clearCommitted,
  } = useMcTreeOps(setFormData);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [validationErrors, setValidationErrors] = React.useState<ValidationErrorItem[]>([]);

  // 1. Fetch specific record and hydrate baseline
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
        const record =
          json.status === "SUCCESS" && json.data
            ? "record" in json.data && json.data.record
              ? json.data.record
              : (json.data as ModelConfigRecord)
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

        // If target mode is Input ('I') and record doesn't exist in DB, initialize new draft
        if (targetMode === CbsRecordFunction.INPUT) {
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
        }
      } catch {
        // If target mode is Input ('I') on 404/failure, open as new entry
        if (targetMode === CbsRecordFunction.INPUT) {
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
        }
      } finally {
        setLoading(false);
      }
    },
    [clearCommitted, hydrate, markAsCommitted, setMode, setRecordId],
  );

  // 3. Validate
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

  // 4. Submit & Rebaseline
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
    setSubmitting(true);
    try {
      const targetId = recordId || formData.TABLENAME || validation.data.TABLENAME || "";
      const json = await cbs.send(
        cbs.modelConfig.save(validation.data as unknown as Record<string, unknown>, {
          recordId: targetId,
        }),
        {
          successTitle: "Model Saved",
          successMessage: `Saved schema #${targetId} to MODEL.CONFIG`,
        },
      );
      if (json.status === "SUCCESS") {
        rebaseline();
        markAsCommitted(validation.data.PROPERTIES || []);
        upsertCatalogItem({
          id: targetId,
          label: validation.data.DESCRIPTION,
          details: `${validation.data.PROPERTIES.length} properties`,
          record: validation.data,
        });
        broadcastRecordMutation("MODEL.CONFIG", targetId);
        reset();
        clearCommitted();
        setValidationErrors([]);
      }
    } catch {
      // Toast handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [clearCommitted, formData, markAsCommitted, rebaseline, recordId, reset, upsertCatalogItem]);

  // 5. Authorize
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.modelConfig.authorize(recordId), {
        successTitle: "Model Authorized",
        successMessage: `Authorized live model #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        broadcastRecordMutation("MODEL.CONFIG", recordId);
        reset();
        clearCommitted();
        setValidationErrors([]);
      }
    } catch {
      // Toast handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [clearCommitted, recordId, reset]);

  // 6. Hold
  const handleHold = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.modelConfig.hold(recordId), {
        successTitle: "Model Placed on Hold",
        successMessage: `Record #${recordId} set to HLD status`,
      });
      if (json.status === "SUCCESS") {
        broadcastRecordMutation("MODEL.CONFIG", recordId);
        await fetchRecord(recordId, CbsRecordFunction.HOLD);
      }
    } catch {
      // Handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [fetchRecord, recordId]);

  // 7. Delete
  const handleDelete = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.modelConfig.delete(recordId), {
        successTitle: "Model Deleted",
        successMessage: `Pending model #${recordId} has been removed`,
      });
      if (json.status === "SUCCESS") {
        broadcastRecordMutation("MODEL.CONFIG", recordId);
        reset();
      }
    } catch {
      // Handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId, reset]);

  // 8. Reverse
  const handleReverse = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.modelConfig.reverse(recordId), {
        successTitle: "Model Reversed",
        successMessage: `Live model #${recordId} status reverted`,
      });
      if (json.status === "SUCCESS") {
        broadcastRecordMutation("MODEL.CONFIG", recordId);
        await fetchRecord(recordId, CbsRecordFunction.REVERSE);
      }
    } catch {
      // Handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [fetchRecord, recordId]);

  // 9. Create New (via + button or F2)
  const handleCreateNew = React.useCallback(
    (newId?: string) => {
      const cleanId = (newId || "").trim().toUpperCase();
      if (cleanId) {
        fetchRecord(cleanId, CbsRecordFunction.INPUT);
      }
    },
    [fetchRecord],
  );

  // 10. Reset to Idle
  const resetToIdle = React.useCallback(() => {
    reset();
    clearCommitted();
    setValidationErrors([]);
  }, [clearCommitted, reset]);

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
    addChildField,
    updateField,
    removeField,
    isFieldCommitted,
    handleCreateNew,
    resetToIdle,
  };
}
