/**
 * @fileoverview Main state and lifecycle hook for the MODEL.CONFIG feature.
 * Coordinates persistence, property tree mutations, validation, and domain actions.
 *
 * @module features/system/model-config/hooks/use-model-config
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toastValidationIssues } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { isRecordEditable, recordFunctionOfMode } from "@/lib/cbs-access";
import { cbsQueries, ModelConfigNotFoundError } from "@/lib/cbs-client";
import type { ModelConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { type ModelValidationErrorItem, validateModelConfig } from "./mc-validation";
import { useMcActions } from "./use-mc-actions";
import { INITIAL_MODEL, useModelConfigPersistence } from "./use-mc-persistence";
import { useMcPropertyOps } from "./use-mc-property-ops";

export function useModelConfig(tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    hydrate,
    reset,
    baseline,
    isDirty,
    resolvedInitialId,
    resolvedInitialMode,
  } = useModelConfigPersistence(tabId);

  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  // The record as loaded: the saved copy the committed-column rules compare against
  const [rawRecord, setRawRecord] = React.useState<ModelConfigRecord | undefined>(undefined);
  const [validationErrors, setValidationErrors] = React.useState<ModelValidationErrorItem[]>([]);

  const { addField, addSubField, updateField, removeField, committedProperty } = useMcPropertyOps(
    formData.PROPERTIES || [],
    setFormData,
    rawRecord?.PROPERTIES,
  );

  const resetToIdle = React.useCallback(() => {
    reset();
    setRawRecord(undefined);
    setValidationErrors([]);
  }, [reset]);

  const initDraft = React.useCallback(
    (cleanId: string) => {
      const draft: ModelConfigRecord = {
        ...INITIAL_MODEL,
        TABLENAME: cleanId.replace(/[.-]/g, "_"),
      };
      setRawRecord(undefined);
      hydrate(draft);
      setValidationErrors([]);
      setMode(CbsRecordFunction.INPUT);
      toast.add({
        title: "New Model Draft",
        description: `Created new draft schema for #${cleanId}. Complete properties and Save.`,
        type: "info",
      });
    },
    [hydrate, setMode],
  );

  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: CbsScreenMode = CbsRecordFunction.INPUT) => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);
      setValidationErrors([]);

      const notFound = () => {
        if (targetMode === CbsRecordFunction.INPUT) {
          initDraft(cleanId);
          return;
        }
        toast.add({
          title: "Model Not Found",
          description: `No model #${cleanId} in MODEL.CONFIG`,
          type: "error",
        });
      };
      const recordFunction = recordFunctionOfMode(targetMode);

      try {
        // The screen always reads fresh: another user may have saved or authorized the model.
        // `enabled` is observer-only, and `cleanId` is already known to be non-empty.
        const { enabled: _enabled, ...recordQuery } = cbsQueries.modelConfig.record(
          cleanId,
          recordFunction,
        );
        const record = await queryClient.query({ ...recordQuery, staleTime: 0 });
        if (record?.TABLENAME) {
          setRawRecord(record);
          hydrate(record);
          setMode(targetMode);
          toast.add({
            title: "Model Loaded",
            description: `Loaded data dictionary for #${cleanId}`,
            type: "success",
          });
          return;
        }
        notFound();
      } catch (err) {
        // Only a model the core says doesn't exist becomes a new draft. Any other failure keeps
        // the screen as it is: a blank draft saved over an existing model would drop its columns.
        if (err instanceof ModelConfigNotFoundError) {
          notFound();
          return;
        }
        toast.add({
          title: "Model Could Not Be Loaded",
          description: err instanceof Error ? err.message : `Failed to load #${cleanId}`,
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [hydrate, initDraft, queryClient, setMode, setRecordId],
  );

  // One check for Validate and Save: the errors go to the checklist, a warning says how many
  const checkModel = React.useCallback((): boolean => {
    const errors = validateModelConfig(formData, rawRecord);
    setValidationErrors(errors);
    if (errors.length > 0) toastValidationIssues(errors.length);
    return errors.length === 0;
  }, [formData, rawRecord]);

  const handleValidate = React.useCallback((): boolean => {
    if (!checkModel()) return false;
    toast.add({
      title: "Validation Successful",
      description: "All dictionary constraints and required properties verified (✓).",
      type: "success",
    });
    return true;
  }, [checkModel]);

  const { handleSubmit, handleAuthorize, handleHold, handleDelete, handleReverse } = useMcActions({
    formData,
    checkModel,
    recordId,
    setSubmitting,
    resetToIdle,
    fetchRecord,
  });

  const handleCreateNew = React.useCallback(
    (newId?: string) => {
      if (newId) fetchRecord(newId, CbsRecordFunction.INPUT);
    },
    [fetchRecord],
  );

  React.useEffect(() => {
    if (!isRecordEditable(mode)) setValidationErrors([]);
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
    formData,
    setFormData,
    baseline,
    rawRecord,
    isDirty,
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
    committedProperty,
    handleCreateNew,
    resetToIdle,
  };
}
