"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs, cbsQueries } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { sanitizeFormConfigRecord } from "@/lib/data-parsers";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
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

  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return;
    const targetId = recordId || "";
    setSubmitting(true);
    try {
      // Clean internal canvas field ids & strip empty fields before sending to backend
      const cleanFormData = sanitizeFormConfigRecord(formData) || formData;

      const res = await sendMutation<FormConfigRecord>(
        cbs.formConfig.save(cleanFormData, { recordId: targetId }),
      );
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation(CbsControlTable.FORM_CONFIG, targetId);
        await invalidateFormCaches();
        toast.add({
          title: "Form Saved",
          description: `Form ${targetId || "configuration"} successfully saved`,
          type: "success",
        });
        if (resetToIdle) {
          resetToIdle();
        } else {
          reset();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    formData,
    handleValidate,
    invalidateFormCaches,
    rebaseline,
    recordId,
    reset,
    resetToIdle,
    sendMutation,
    setSubmitting,
  ]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await sendMutation<FormConfigRecord>(cbs.formConfig.authorize(recordId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation(CbsControlTable.FORM_CONFIG, recordId);
        await invalidateFormCaches();
        toast.add({
          title: "Form Authorized",
          description: `Record ${recordId} approved`,
          type: "success",
        });
        if (resetToIdle) {
          resetToIdle();
        } else {
          reset();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [invalidateFormCaches, recordId, rebaseline, reset, resetToIdle, sendMutation, setSubmitting]);

  const handleHold = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await sendMutation(cbs.formConfig.hold(recordId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation(CbsControlTable.FORM_CONFIG, recordId);
        toast.add({
          title: "Record Held",
          description: `${recordId} placed on hold`,
          type: "default",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [recordId, rebaseline, sendMutation, setSubmitting]);

  const handleDelete = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await sendMutation(cbs.formConfig.delete(recordId));
      if (res.status === "SUCCESS") {
        broadcastRecordMutation(CbsControlTable.FORM_CONFIG, recordId);
        await invalidateFormCaches();
        if (resetToIdle) {
          resetToIdle();
        } else {
          reset();
        }
        toast.add({ title: "Form Deleted", description: `${recordId} deleted`, type: "default" });
      }
    } finally {
      setSubmitting(false);
    }
  }, [invalidateFormCaches, recordId, reset, resetToIdle, sendMutation, setSubmitting]);

  const handleReverse = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await sendMutation(cbs.formConfig.reverse(recordId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation(CbsControlTable.FORM_CONFIG, recordId);
        await invalidateFormCaches();
        toast.add({
          title: "Record Reversed",
          description: `${recordId} reversed`,
          type: "default",
        });
        if (resetToIdle) {
          resetToIdle();
        } else {
          reset();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [invalidateFormCaches, recordId, rebaseline, reset, resetToIdle, sendMutation, setSubmitting]);

  return {
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
  };
}
