"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export interface UseFcActionsParams {
  formData: FormConfigRecord;
  recordId: string;
  handleValidate: () => boolean;
  rebaseline: () => void;
  reset: () => void;
  refreshForms: () => Promise<void>;
  setSubmitting: (val: boolean) => void;
}

export function useFcActions({
  formData,
  recordId,
  handleValidate,
  rebaseline,
  reset,
  refreshForms,
  setSubmitting,
}: UseFcActionsParams) {
  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return;
    const targetId = recordId || (formData.recordId as string) || "";
    setSubmitting(true);
    try {
      const res = await cbs.send<FormConfigRecord>(
        cbs.formConfig.save(formData, { recordId: targetId }),
      );
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("FORM.CONFIG", targetId);
        refreshForms();
        toast.add({
          title: "Form Saved",
          description: `Form ${targetId || "configuration"} successfully saved`,
          type: "success",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, handleValidate, rebaseline, refreshForms, recordId, setSubmitting]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send<FormConfigRecord>(cbs.formConfig.authorize(recordId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("FORM.CONFIG", recordId);
        refreshForms();
        toast.add({
          title: "Form Authorized",
          description: `Record ${recordId} approved`,
          type: "success",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [recordId, rebaseline, refreshForms, setSubmitting]);

  const handleHold = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send(cbs.formConfig.hold(recordId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("FORM.CONFIG", recordId);
        toast.add({
          title: "Record Held",
          description: `${recordId} placed on hold`,
          type: "default",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [recordId, rebaseline, setSubmitting]);

  const handleDelete = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send(cbs.formConfig.delete(recordId));
      if (res.status === "SUCCESS") {
        broadcastRecordMutation("FORM.CONFIG", recordId);
        refreshForms();
        reset();
        toast.add({ title: "Form Deleted", description: `${recordId} deleted`, type: "default" });
      }
    } finally {
      setSubmitting(false);
    }
  }, [recordId, refreshForms, reset, setSubmitting]);

  const handleReverse = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send(cbs.formConfig.reverse(recordId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("FORM.CONFIG", recordId);
        refreshForms();
        toast.add({
          title: "Record Reversed",
          description: `${recordId} reversed`,
          type: "default",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [recordId, rebaseline, refreshForms, setSubmitting]);

  return {
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
  };
}
