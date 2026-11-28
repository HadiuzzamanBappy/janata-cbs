"use client";

import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { recordSaveData } from "@/lib/cbs-record";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import {
  type ApiResponse,
  type AuditData,
  type FormConfigRecord,
  isApiSuccess,
} from "@/lib/data-schemas";
import { CBS_IDLE_MODE, CbsRecordFunction, CbsRecordStatus, type CbsScreenMode } from "@/types";

export interface UseFormMutationsProps {
  modelCode: string;
  schema: FormConfigRecord | null;
  searchRecordId: string;
  screenMode: CbsScreenMode;
  values: Record<string, unknown>;
  /** The record as loaded (empty for a new entry); a save sends what differs from it. */
  baseline: Record<string, unknown>;
  validate: () => boolean;
  rebaseline: () => void;
  clearForm: () => void;
}

/**
 * Handles transactional banking mutations (Commit, Hold, Delete, Authorize/Reverse).
 */
export function useFormMutations({
  modelCode,
  schema,
  searchRecordId,
  screenMode,
  values,
  baseline,
  validate,
  rebaseline,
  clearForm,
}: UseFormMutationsProps) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const { sendMutation } = useIdempotentSend();

  /**
   * Sends one mutation. On success other windows are told, then the screen returns to idle, or
   * (`stayOnRecord`, for Hold) keeps the record with the sent values as its new baseline.
   */
  const executeTransaction = React.useCallback(
    async (
      targetId: string,
      operation: () => Promise<ApiResponse>,
      options: { stayOnRecord?: boolean } = {},
    ) => {
      setSubmitting(true);
      try {
        const json = await operation();
        if (!isApiSuccess(json)) return;
        broadcastRecordMutation(modelCode, targetId);
        if (options.stayOnRecord) rebaseline();
        else clearForm();
      } finally {
        setSubmitting(false);
      }
    },
    [modelCode, rebaseline, clearForm],
  );

  const handleSubmit = React.useCallback(
    async (e?: React.SyntheticEvent) => {
      if (e) e.preventDefault();
      if (!validate()) return;
      if (!schema || !modelCode) return;

      // An amendment sends only what changed from the loaded record; a new entry (empty
      // baseline) sends every field
      const commitData = recordSaveData(baseline, values, screenMode === CbsRecordFunction.INPUT);
      const targetId = (searchRecordId || (values.id as string) || "").trim();

      await executeTransaction(targetId, () =>
        sendMutation(
          cbs.model(modelCode).save(commitData, {
            recordId: targetId,
          }),
          {
            successTitle: "Transaction Saved",
            successMessage: `Record saved successfully for ${schema.title}`,
          },
        ),
      );
    },
    [
      validate,
      schema,
      modelCode,
      screenMode,
      baseline,
      values,
      searchRecordId,
      executeTransaction,
      sendMutation,
    ],
  );

  const handleHold = React.useMemo(() => {
    if (screenMode === CBS_IDLE_MODE || !schema || !modelCode) return undefined;
    return async () => {
      const targetId = (searchRecordId || (values.id as string) || "").trim();
      await executeTransaction(
        targetId,
        () =>
          sendMutation(cbs.model(modelCode).hold(targetId, values), {
            successTitle: "Transaction Held",
            successMessage: `Record draft for ${schema.title} placed on Hold.`,
          }),
        { stayOnRecord: true },
      );
    };
  }, [screenMode, schema, modelCode, searchRecordId, values, executeTransaction, sendMutation]);

  const handleDelete = React.useMemo(() => {
    if (screenMode === CBS_IDLE_MODE || !schema || !modelCode) return undefined;
    return async () => {
      const targetId = (searchRecordId || (values.id as string) || "").trim();
      if (!targetId) {
        toast.add({
          title: "Record ID Required",
          description: "Cannot delete without a Record ID.",
          type: "warning",
        });
        return;
      }

      await executeTransaction(targetId, () =>
        sendMutation(cbs.model(modelCode).delete(targetId), {
          successTitle: "Record Deleted",
          successMessage: `Record #${targetId} marked for deletion in ${schema.title}.`,
        }),
      );
    };
  }, [screenMode, schema, modelCode, searchRecordId, values.id, executeTransaction, sendMutation]);

  const handleAuthorizeReverse = React.useMemo(() => {
    if (screenMode === CBS_IDLE_MODE || !schema || !modelCode) return undefined;
    return async () => {
      const targetId = (searchRecordId || (values.id as string) || "").trim();
      if (!targetId) {
        toast.add({
          title: "Record ID Required",
          description: "Cannot authorize or reverse without a Record ID.",
          type: "warning",
        });
        return;
      }

      // Same source as the action bar's label: the core keeps the status in auditData.recStatus
      const recStatus = (values.auditData as AuditData | undefined)?.recStatus;
      const isLive = recStatus?.trim().toUpperCase() === CbsRecordStatus.AU;
      const payload = isLive
        ? cbs.model(modelCode).reverse(targetId)
        : cbs.model(modelCode).authorize(targetId);

      const actionName = isLive ? "Reversal" : "Authorization";

      await executeTransaction(targetId, () =>
        sendMutation(payload, {
          successTitle: `${actionName} Successful`,
          successMessage: `Record #${targetId} ${actionName.toLowerCase()} completed for ${schema.title}.`,
        }),
      );
    };
  }, [screenMode, schema, modelCode, searchRecordId, values, executeTransaction, sendMutation]);

  return {
    submitting,
    handleSubmit,
    handleHold,
    handleDelete,
    handleAuthorizeReverse,
  };
}
