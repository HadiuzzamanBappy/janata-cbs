"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { sanitizeModelConfigRecord } from "@/lib/data-parsers";
import type { CbsWirePayload } from "@/lib/data-schemas";
import {
  type ModelConfigRecord,
  modelConfigRecordSchema,
} from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { type ModelValidationErrorItem, mapZodIssuesToValidationErrors } from "./mc-validation";

export interface UseMcActionsParams {
  formData: ModelConfigRecord;
  recordId: string;
  setSubmitting: (val: boolean) => void;
  setValidationErrors: (errors: ModelValidationErrorItem[]) => void;
  rebaseline: () => void;
  resetToIdle: () => void;
  markAsCommitted: (properties: ModelConfigRecord["PROPERTIES"]) => void;
  upsertCatalogItem: (item: {
    id: string;
    label: string;
    details: string;
    record?: ModelConfigRecord;
  }) => void;
  fetchRecord: (id: string, mode?: CbsScreenMode) => Promise<void>;
}

export function useMcActions({
  formData,
  recordId,
  setSubmitting,
  setValidationErrors,
  rebaseline,
  resetToIdle,
  markAsCommitted,
  upsertCatalogItem,
  fetchRecord,
}: UseMcActionsParams) {
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
    [recordId, setSubmitting],
  );

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
    const cleanData = sanitizeModelConfigRecord(validation.data) || validation.data;
    await executeMutation(
      cbs.modelConfig.save(cleanData as unknown as Record<string, unknown>, {
        recordId: targetId,
      }),
      {
        targetId,
        successTitle: "Model Saved",
        successMessage: `Saved schema #${targetId} to MODEL.CONFIG`,
        onSuccess: () => {
          rebaseline();
          markAsCommitted(cleanData.PROPERTIES || []);
          upsertCatalogItem({
            id: targetId,
            label: cleanData.DESCRIPTION,
            details: `${cleanData.PROPERTIES.length} properties`,
            record: cleanData,
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
    setValidationErrors,
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

  return {
    executeMutation,
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
  };
}
