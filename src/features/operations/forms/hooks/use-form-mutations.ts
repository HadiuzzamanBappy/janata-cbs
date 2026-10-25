"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { computeDelta } from "@/lib/cbs-record";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import type { CompiledFormSpec } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";

export interface UseFormMutationsOptions {
  spec: CompiledFormSpec | null;
  searchRecordId: string;
  screenMode: CbsScreenMode;
  setScreenMode: (mode: CbsScreenMode) => void;
  values: Record<string, unknown>;
  initialValues: Record<string, unknown>;
  validate: () => boolean;
  resetForm: (values?: Record<string, unknown>) => void;
  loadRecordData: (id: string, mode: CbsScreenMode) => Promise<void>;
  onSuccess?: (result: unknown) => void;
}

export function useFormMutations({
  spec,
  searchRecordId,
  screenMode,
  setScreenMode,
  values,
  initialValues,
  validate,
  resetForm,
  loadRecordData: _loadRecordData,
  onSuccess,
}: UseFormMutationsOptions) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);

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
      if (!spec) return;

      setSubmitting(true);
      try {
        const delta =
          screenMode === "I" && Object.keys(initialValues).length > 0
            ? computeDelta(initialValues, values).modifiedFields
            : values;

        const commitData = Object.keys(delta).length > 0 ? delta : values;
        const targetId = (searchRecordId || (values.id as string) || "").trim();

        const json = await cbs.send(
          cbs.form.commitRecord(spec.code, commitData, {
            recordId: targetId,
          }),
          {
            successTitle: "Transaction Saved",
            successMessage: `Record saved successfully for ${spec.title}`,
          },
        );

        if (json.status === "SUCCESS") {
          broadcastRecordMutation(spec.code, targetId);
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
      spec,
      screenMode,
      initialValues,
      values,
      searchRecordId,
      resetForm,
      setScreenMode,
      onSuccess,
    ],
  );

  const handleHold = React.useMemo(() => {
    if (screenMode === "IDLE" || !spec) return undefined;
    return async () => {
      const id = searchRecordId.trim() || (values.id as string) || "";
      setSubmitting(true);
      try {
        const json = await cbs.send(cbs.form.holdRecord(spec.code, id, values), {
          successTitle: "Transaction Held",
          successMessage: `Record draft for ${spec.title} placed on Hold.`,
        });
        if (json.status === "SUCCESS") {
          broadcastRecordMutation(spec.code, id);
          if (onSuccess) onSuccess(json);
        }
      } finally {
        setSubmitting(false);
      }
    };
  }, [screenMode, spec, searchRecordId, values, onSuccess]);

  const handleDelete = React.useMemo(() => {
    if (screenMode === "IDLE" || !spec) return undefined;
    return async () => {
      const id = searchRecordId.trim() || (values.id as string) || "";
      if (!id) {
        toast.add({
          title: "Record ID Required",
          description: "Cannot delete an unreferenced draft without a Record ID.",
          type: "warning",
        });
        return;
      }
      setSubmitting(true);
      try {
        const json = await cbs.send(cbs.form.deleteRecord(spec.code, id), {
          successTitle: "Record Deleted",
          successMessage: `Record #${id} marked for deletion in ${spec.title}.`,
        });
        if (json.status === "SUCCESS") {
          broadcastRecordMutation(spec.code, id);
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
    spec,
    searchRecordId,
    values.id,
    resetForm,
    initialValues,
    setScreenMode,
    onSuccess,
  ]);

  const handleAuthorizeReverse = React.useMemo(() => {
    if (screenMode === "IDLE" || !spec) return undefined;
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
          ? cbs.form.reverseRecord(spec.code, id)
          : cbs.form.authorizeRecord(spec.code, id);

        const actionName = isLive ? "Reversal" : "Authorization";
        const json = await cbs.send(payload, {
          successTitle: `${actionName} Successful`,
          successMessage: `Transaction ${actionName.toLowerCase()} completed for record #${id}.`,
        });
        if (json.status === "SUCCESS") {
          broadcastRecordMutation(spec.code, id);
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
    spec,
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
