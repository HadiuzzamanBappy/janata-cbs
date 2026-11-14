/**
 * @fileoverview Domain actions and mutation coordinator for FORM.CONFIG.
 * Dispatches save, authorize, hold, delete, and reverse mutations via
 * wire protocol request factories with query cache invalidations.
 *
 * @module features/system/form-config/hooks/use-fc-actions
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { cbs, cbsQueries } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { sanitizeFormConfigRecord } from "@/lib/data-parsers";
import type { CbsWirePayload, FormConfigRecord } from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";

export interface UseFcActionsParams {
  formData: FormConfigRecord;
  recordId: string;
  handleValidate: () => boolean;
  rebaseline: () => void;
  reset: () => void;
  resetToIdle?: () => void;
  setSubmitting: (val: boolean) => void;
}

export function useFcActions({
  formData,
  recordId,
  handleValidate,
  rebaseline,
  reset,
  resetToIdle,
  setSubmitting,
}: UseFcActionsParams) {
  const { sendMutation } = useIdempotentSend();
  const queryClient = useQueryClient();

  const invalidateFormCaches = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: cbsQueries.formConfig.schemaRootKey });
  }, [queryClient]);

  const executeMutation = React.useCallback(
    async (
      payload: CbsWirePayload,
      options: {
        successTitle: string;
        successMessage: string;
        targetId?: string;
        rebaselineOnSuccess?: boolean;
        resetOnSuccess?: boolean;
        onSuccess?: () => void | Promise<void>;
      },
    ) => {
      setSubmitting(true);
      try {
        const res = await sendMutation<FormConfigRecord>(payload, {
          successTitle: options.successTitle,
          successMessage: options.successMessage,
        });
        if (res.status === "SUCCESS") {
          const syncId = (options.targetId || recordId).trim().toUpperCase();
          if (syncId) {
            broadcastRecordMutation(CbsControlTable.FORM_CONFIG, syncId);
          }
          await invalidateFormCaches();
          if (options.rebaselineOnSuccess !== false) {
            rebaseline();
          }
          if (options.resetOnSuccess !== false) {
            if (resetToIdle) {
              resetToIdle();
            } else {
              reset();
            }
          }
          await options.onSuccess?.();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [invalidateFormCaches, rebaseline, recordId, reset, resetToIdle, sendMutation, setSubmitting],
  );

  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return;
    const targetId = (recordId || "").trim().toUpperCase();
    const cleanFormData = sanitizeFormConfigRecord(formData) || formData;

    await executeMutation(cbs.formConfig.save(cleanFormData, { recordId: targetId }), {
      successTitle: "Form Saved",
      successMessage: `Form ${targetId || "configuration"} successfully saved`,
      targetId,
    });
  }, [executeMutation, formData, handleValidate, recordId]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.formConfig.authorize(recordId), {
      successTitle: "Form Authorized",
      successMessage: `Record ${recordId} approved`,
    });
  }, [executeMutation, recordId]);

  const handleHold = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.formConfig.hold(recordId), {
      successTitle: "Record Held",
      successMessage: `${recordId} placed on hold`,
      resetOnSuccess: false,
    });
  }, [executeMutation, recordId]);

  const handleDelete = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.formConfig.delete(recordId), {
      successTitle: "Form Deleted",
      successMessage: `${recordId} deleted`,
      rebaselineOnSuccess: false,
    });
  }, [executeMutation, recordId]);

  const handleReverse = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.formConfig.reverse(recordId), {
      successTitle: "Record Reversed",
      successMessage: `${recordId} reversed`,
    });
  }, [executeMutation, recordId]);

  return {
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
  };
}
