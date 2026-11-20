/**
 * @fileoverview Domain actions and mutation coordinator for MODEL.CONFIG.
 * Dispatches save, authorize, hold, delete, and reverse mutations via
 * wire protocol request factories with query cache invalidations.
 *
 * @module features/system/model-config/hooks/use-mc-actions
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs, cbsQueries } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { sanitizeModelConfigRecord } from "@/lib/data-parsers";
import { type CbsWirePayload, isApiSuccess, type ModelConfigRecord } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, type CbsScreenMode } from "@/types";
import { type ModelValidationErrorItem, validateModelConfig } from "./mc-validation";

export interface UseMcActionsParams {
  formData: ModelConfigRecord;
  recordId: string;
  setSubmitting: (val: boolean) => void;
  setValidationErrors: (errors: ModelValidationErrorItem[]) => void;
  resetToIdle: () => void;
  fetchRecord: (id: string, mode?: CbsScreenMode) => Promise<void>;
}

export function useMcActions({
  formData,
  recordId,
  setSubmitting,
  setValidationErrors,
  resetToIdle,
  fetchRecord,
}: UseMcActionsParams) {
  const { sendMutation } = useIdempotentSend();
  const queryClient = useQueryClient();

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
        const json = await sendMutation(payload, {
          successTitle: options.successTitle,
          successMessage: options.successMessage,
        });
        if (isApiSuccess(json)) {
          const syncId = (options.targetId || recordId).trim().toUpperCase();
          if (syncId) {
            broadcastRecordMutation(CbsControlTable.MODEL_CONFIG, syncId);
          }
          await Promise.all([
            syncId
              ? queryClient.invalidateQueries({
                  queryKey: cbsQueries.modelConfig.record(syncId).queryKey,
                })
              : Promise.resolve(),
            queryClient.invalidateQueries({ queryKey: cbsQueries.formConfig.schemaRootKey }),
          ]);
          await options.onSuccess?.();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [queryClient, recordId, sendMutation, setSubmitting],
  );

  const handleSubmit = React.useCallback(async () => {
    const errors = validateModelConfig(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.add({
        title: "Validation Issues Found",
        description: `${errors.length} issue${errors.length > 1 ? "s" : ""} require your attention before saving.`,
        type: "warning",
      });
      return;
    }

    setValidationErrors([]);
    const targetId = recordId || formData.TABLENAME || "";
    const cleanData = sanitizeModelConfigRecord(formData);
    await executeMutation(
      cbs.modelConfig.save(cleanData, {
        recordId: targetId,
      }),
      {
        targetId,
        successTitle: "Model Saved",
        successMessage: `Saved schema #${targetId} to MODEL.CONFIG`,
        onSuccess: () => resetToIdle(),
      },
    );
  }, [executeMutation, formData, recordId, resetToIdle, setValidationErrors]);

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

  return {
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
  };
}
