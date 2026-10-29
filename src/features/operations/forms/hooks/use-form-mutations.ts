"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { computeDelta } from "@/lib/cbs-record";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";

export interface UseFormMutationsOptions {
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
}: UseFormMutationsOptions) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Commit / Save (PUT / POST)
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

      setSubmitting(true);
      try {
        const delta =
          screenMode === "I" && Object.keys(initialValues).length > 0
            ? computeDelta(initialValues, values).modifiedFields
            : values;

        const commitData = Object.keys(delta).length > 0 ? delta : values;
        const targetId = (searchRecordId || (values.id as string) || "").trim();

        const json = await cbs.send(
          cbs.form.commitRecord(modelCode, commitData, {
            recordId: targetId,
          }),
          {
            successTitle: "Transaction Saved",
            successMessage: `Record saved successfully for ${schema.title}`,
          },
        );

        if (json.status === "SUCCESS") {
          broadcastRecordMutation(modelCode, targetId);
          resetForm(initialValues);
          setScreenMode("IDLE");
          if (onSuccess) onSuccess(json);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [
      validate,
      schema,
      modelCode,
      screenMode,
      initialValues,
      values,
      searchRecordId,
      resetForm,
      setScreenMode,
      onSuccess,
    ],
  );

  // Hold Draft (HLD)
  const handleHold = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema || !modelCode) return undefined;
    return async () => {
      const id = searchRecordId.trim() || (values.id as string) || "";
      setSubmitting(true);
      try {
        const json = await cbs.send(cbs.form.holdRecord(modelCode, id, values), {
          successTitle: "Transaction Held",
          successMessage: `Record draft for ${schema.title} placed on Hold.`,
        });
        if (json.status === "SUCCESS") {
          broadcastRecordMutation(modelCode, id);
          if (onSuccess) onSuccess(json);
        }
      } finally {
        setSubmitting(false);
      }
    };
  }, [screenMode, schema, modelCode, searchRecordId, values, onSuccess]);

  // Delete Record / Draft (DEL)
  const handleDelete = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema || !modelCode) return undefined;
    return async () => {
      const id = searchRecordId.trim() || (values.id as string) || "";
      if (!id) {
        toast.add({
          title: "Record ID Required",
          description: "Cannot delete without a Record ID.",
          type: "warning",
        });
        return;
      }
      setSubmitting(true);
      try {
        const json = await cbs.send(cbs.form.deleteRecord(modelCode, id), {
          successTitle: "Record Deleted",
          successMessage: `Record #${id} marked for deletion in ${schema.title}.`,
        });
        if (json.status === "SUCCESS") {
          broadcastRecordMutation(modelCode, id);
          resetForm(initialValues);
          setScreenMode("IDLE");
          if (onSuccess) onSuccess(json);
        }
      } finally {
        setSubmitting(false);
      }
    };
  }, [
    screenMode,
    schema,
    modelCode,
    searchRecordId,
    values.id,
    resetForm,
    initialValues,
    setScreenMode,
    onSuccess,
  ]);

  // Authorize or Reverse (AUT / REV)
  const handleAuthorizeReverse = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema || !modelCode) return undefined;
    return async () => {
      const id = searchRecordId.trim() || (values.id as string) || "";
      if (!id) {
        toast.add({
          title: "Record ID Required",
          description: "Cannot authorize or reverse without a Record ID.",
          type: "warning",
        });
        return;
      }
      setSubmitting(true);
      try {
        const isLive = values.RECORD_STATUS === "AU" || values.status === "AU";
        const payload = isLive
          ? cbs.form.reverseRecord(modelCode, id)
          : cbs.form.authorizeRecord(modelCode, id);

        const actionName = isLive ? "Reversal" : "Authorization";
        const json = await cbs.send(payload, {
          successTitle: `${actionName} Successful`,
          successMessage: `Transaction ${actionName.toLowerCase()} completed for record #${id}.`,
        });
        if (json.status === "SUCCESS") {
          broadcastRecordMutation(modelCode, id);
          resetForm(initialValues);
          setScreenMode("IDLE");
          if (onSuccess) onSuccess(json);
        }
      } finally {
        setSubmitting(false);
      }
    };
  }, [
    screenMode,
    schema,
    modelCode,
    searchRecordId,
    values,
    resetForm,
    initialValues,
    setScreenMode,
    onSuccess,
  ]);

  return {
    submitting,
    onSubmit: screenMode !== "IDLE" ? handleSubmit : undefined,
    onHold: handleHold,
    onDelete: handleDelete,
    onAuthorizeReverse: handleAuthorizeReverse,
  };
}
