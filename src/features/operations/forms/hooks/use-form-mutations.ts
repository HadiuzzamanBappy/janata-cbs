"use client";

import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { computeDelta } from "@/lib/cbs-record";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { CbsRecordStatus, type CbsScreenMode } from "@/types";

export interface UseFormMutationsProps {
  modelCode: string;
  schema: FormConfigRecord | null;
  searchRecordId: string;
  screenMode: CbsScreenMode;
  setScreenMode: (mode: CbsScreenMode) => void;
  values: Record<string, unknown>;
  initialValues: Record<string, unknown>;
  validate: () => boolean;
  resetForm: (values?: Record<string, unknown>) => void;
  onSuccess?: (result: unknown) => void;
}

/**
 * Handles transactional banking mutations (Commit, Hold, Delete, Authorize/Reverse).
 */
export function useFormMutations({
  modelCode,
  schema,
  searchRecordId,
  screenMode,
  setScreenMode,
  values,
  initialValues,
  validate,
  resetForm,
  onSuccess,
}: UseFormMutationsProps) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const { sendMutation } = useIdempotentSend();

  const executeTransaction = React.useCallback(
    async (
      targetId: string,
      operation: () => Promise<{ status?: string }>,
      options: { resetOnSuccess?: boolean } = { resetOnSuccess: true },
    ) => {
      setSubmitting(true);
      try {
        const json = await operation();
        if (json?.status === "SUCCESS") {
          broadcastRecordMutation(modelCode, targetId);
          if (options.resetOnSuccess) {
            resetForm(initialValues);
            setScreenMode("IDLE");
          }
          if (onSuccess) onSuccess(json);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [modelCode, initialValues, resetForm, setScreenMode, onSuccess],
  );

  const handleSubmit = React.useCallback(
    async (e?: React.SyntheticEvent) => {
      if (e) e.preventDefault();
      if (!validate()) {
        toast.add({
          title: "Validation Error",
          description: "Please correct the highlighted field errors.",
          type: "warning",
        });
        return;
      }
      if (!schema || !modelCode) return;

      const delta =
        screenMode === "I" && Object.keys(initialValues).length > 0
          ? computeDelta(initialValues, values).modifiedFields
          : values;

      const commitData = Object.keys(delta).length > 0 ? delta : values;
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
      initialValues,
      values,
      searchRecordId,
      executeTransaction,
      sendMutation,
    ],
  );

  const handleHold = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema || !modelCode) return undefined;
    return async () => {
      const targetId = (searchRecordId || (values.id as string) || "").trim();
      await executeTransaction(
        targetId,
        () =>
          sendMutation(cbs.model(modelCode).hold(targetId, values), {
            successTitle: "Transaction Held",
            successMessage: `Record draft for ${schema.title} placed on Hold.`,
          }),
        { resetOnSuccess: false },
      );
    };
  }, [screenMode, schema, modelCode, searchRecordId, values, executeTransaction, sendMutation]);

  const handleDelete = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema || !modelCode) return undefined;
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
    if (screenMode === "IDLE" || !schema || !modelCode) return undefined;
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

      const isLive =
        values.RECORD_STATUS === CbsRecordStatus.AU || values.status === CbsRecordStatus.AU;
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
