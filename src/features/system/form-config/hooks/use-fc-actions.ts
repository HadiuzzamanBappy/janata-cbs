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
import { type CbsWirePayload, type FormConfigRecord, isApiSuccess } from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";

export interface UseFcActionsParams {
  formData: FormConfigRecord;
  recordId: string;
  /** Shows validation issues; returns true when the draft may be saved. */
  validateBeforeSave: () => boolean;
  rebaseline: () => void;
  resetToIdle: () => void;
  setSubmitting: (val: boolean) => void;
}

export function useFcActions({
  formData,
  recordId,
  validateBeforeSave,
  rebaseline,
  resetToIdle,
  setSubmitting,
}: UseFcActionsParams) {
  const { sendMutation } = useIdempotentSend();
  const queryClient = useQueryClient();

  /**
   * Sends one mutation. On success other windows and the form caches are told, then the screen
   * either returns to idle or (`stayOnRecord`, for Hold) keeps the record, its sent draft now the
   * baseline.
   */
  const executeMutation = React.useCallback(
    async (
      payload: CbsWirePayload,
      options: { successTitle: string; successMessage: string; stayOnRecord?: boolean },
    ) => {
      setSubmitting(true);
      try {
        const res = await sendMutation<FormConfigRecord>(payload, {
          successTitle: options.successTitle,
          successMessage: options.successMessage,
        });
        if (!isApiSuccess(res)) return;
        const syncId = recordId.trim().toUpperCase();
        if (syncId) broadcastRecordMutation(CbsControlTable.FORM_CONFIG, syncId);
        await queryClient.invalidateQueries({ queryKey: cbsQueries.formConfig.schemaRootKey });
        if (options.stayOnRecord) rebaseline();
        else resetToIdle();
      } finally {
        setSubmitting(false);
      }
    },
    [queryClient, rebaseline, recordId, resetToIdle, sendMutation, setSubmitting],
  );

  const handleSubmit = React.useCallback(async () => {
    if (!validateBeforeSave()) return;
    const targetId = recordId.trim().toUpperCase();
    await executeMutation(
      cbs.formConfig.save(sanitizeFormConfigRecord(formData), { recordId: targetId }),
      {
        successTitle: "Form Saved",
        successMessage: `Form ${targetId || "configuration"} successfully saved`,
      },
    );
  }, [executeMutation, formData, recordId, validateBeforeSave]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.formConfig.authorize(recordId), {
      successTitle: "Form Authorized",
      successMessage: `Record ${recordId} approved`,
    });
  }, [executeMutation, recordId]);

  // Hold parks the work in progress: the draft is sent (unvalidated) and the screen stays on it
  const handleHold = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.formConfig.hold(recordId, sanitizeFormConfigRecord(formData)), {
      successTitle: "Record Held",
      successMessage: `${recordId} placed on hold`,
      stayOnRecord: true,
    });
  }, [executeMutation, formData, recordId]);

  const handleDelete = React.useCallback(async () => {
    if (!recordId) return;
    await executeMutation(cbs.formConfig.delete(recordId), {
      successTitle: "Form Deleted",
      successMessage: `${recordId} deleted`,
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
