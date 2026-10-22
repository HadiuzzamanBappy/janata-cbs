"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { serializeModelToWireJson } from "@/lib/data-parsers";
import {
  type ModelConfigRecord,
  modelConfigRecordSchema,
  type ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";
import type { CbsScreenMode } from "@/types";
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
    async (targetId: string, targetMode: CbsScreenMode = "I") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);
      setValidationErrors([]);

      try {
        const json = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(cleanId));
        if (json.status === "SUCCESS" && json.data) {
          hydrate(json.data);
          markAsCommitted(json.data.properties || []);
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
        if (targetMode === "I") {
          const draft: ModelConfigRecord = {
            ...INITIAL_MODEL,
            recordId: cleanId,
            tableName: cleanId.replace(/[\.-]/g, "_"),
            description: cleanId.replace(/[_\.-]/g, " "),
          };
          hydrate(draft);
          clearCommitted();
          setValidationErrors([]);
          setMode("I");
          toast.add({
            title: "New Model Draft",
            description: `Created new draft schema for #${cleanId}. Complete fields and Save.`,
            type: "info",
          });
        }
      } catch {
        // If target mode is Input ('I') on 404/failure, open as new entry
        if (targetMode === "I") {
          const draft: ModelConfigRecord = {
            ...INITIAL_MODEL,
            recordId: cleanId,
            tableName: cleanId.replace(/[\.-]/g, "_"),
            description: cleanId.replace(/[_\.-]/g, " "),
          };
          hydrate(draft);
          clearCommitted();
          setValidationErrors([]);
          setMode("I");
          toast.add({
            title: "New Model Draft",
            description: `Created new draft schema for #${cleanId}. Complete fields and Save.`,
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
      const errors = mapZodIssuesToValidationErrors(validation.error.issues, formData.properties);
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
      description: "All dictionary constraints and required fields verified (✓).",
      type: "success",
    });
    return true;
  }, [formData]);

  // 4. Submit & Rebaseline
  const handleSubmit = React.useCallback(async () => {
    const validation = modelConfigRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errors = mapZodIssuesToValidationErrors(validation.error.issues, formData.properties);
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
      const wireData = serializeModelToWireJson(validation.data);
      const json = await cbs.send(
        cbs.modelConfig.save(wireData as unknown as Record<string, unknown>, {
          recordId: formData.recordId,
        }),
        {
          successTitle: "Model Saved",
          successMessage: `Saved schema #${formData.recordId} to MODEL.CONFIG`,
        },
      );
      if (json.status === "SUCCESS") {
        rebaseline();
        markAsCommitted(validation.data.properties || []);
        const targetId =
          validation.data.recordId || formData.recordId || validation.data.tableName || "";
        upsertCatalogItem({
          id: targetId,
          label: validation.data.description,
          details: `${validation.data.properties.length} fields`,
          record: validation.data,
        });
        broadcastRecordMutation("MODEL.CONFIG", targetId);
        setMode("I");
      }
    } catch {
      // Toast handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [formData, markAsCommitted, rebaseline, setMode, upsertCatalogItem]);

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
        await fetchRecord(recordId, "S");
      }
    } catch {
      // Toast handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [fetchRecord, recordId]);

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
        await fetchRecord(recordId, "H");
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
        await fetchRecord(recordId, "R");
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
        fetchRecord(cleanId, "I");
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
    if (mode !== "I") {
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
