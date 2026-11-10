"use client";

import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { sanitizeMenuTreeRecord } from "@/lib/data-parsers";
import type {
  MenuDesignerValidationError,
  MenuTreeRecord,
} from "@/lib/data-schemas/menu-designer-schema";

export interface UseMdActionsOptions {
  formData: MenuTreeRecord;
  recordId: string;
  handleValidate: () => boolean;
  rebaseline: () => void;
  refetchTrees: () => void;
  setValidationErrors: (errors: MenuDesignerValidationError[]) => void;
  reset: () => void;
}

export function useMdActions({
  formData,
  recordId,
  handleValidate,
  rebaseline,
  refetchTrees,
  setValidationErrors,
  reset,
}: UseMdActionsOptions) {
  const [submitting, setSubmitting] = React.useState(false);
  const { sendMutation } = useIdempotentSend();

  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return false;

    setSubmitting(true);
    try {
      const wireData = sanitizeMenuTreeRecord(formData);
      const json = await sendMutation(
        cbs.menuTree.save(wireData as unknown as Record<string, unknown>, {
          recordId: formData.recordId || recordId,
        }),
        {
          successTitle: "Navigation Tree Committed",
          successMessage: `Saved hierarchy ${formData.recordId || recordId} to MENU.TREE`,
        },
      );

      if (json.status === "SUCCESS") {
        rebaseline();
        refetchTrees();
        setValidationErrors([]);
        reset();
        return true;
      }
      return false;
    } catch (err: unknown) {
      toast.add({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save hierarchy",
        type: "error",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    formData,
    recordId,
    reset,
    rebaseline,
    refetchTrees,
    handleValidate,
    setValidationErrors,
    sendMutation,
  ]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId.trim()) return false;
    setSubmitting(true);
    try {
      const json = await sendMutation(cbs.menuTree.authorize(recordId.trim().toUpperCase()), {
        successTitle: "Navigation Tree Authorized",
        successMessage: `Authorized live menu tree #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        rebaseline();
        refetchTrees();
        reset();
        return true;
      }
      return false;
    } catch (err: unknown) {
      toast.add({
        title: "Authorization Error",
        description: err instanceof Error ? err.message : "Authorization failed",
        type: "error",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [recordId, reset, rebaseline, refetchTrees, sendMutation]);

  return { submitting, handleSubmit, handleAuthorize };
}
