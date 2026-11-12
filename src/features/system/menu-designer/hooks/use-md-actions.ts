"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs, cbsQueries } from "@/lib/cbs-client";
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
  setValidationErrors: (errors: MenuDesignerValidationError[]) => void;
  reset: () => void;
}

export function useMdActions({
  formData,
  recordId,
  handleValidate,
  rebaseline,
  setValidationErrors,
  reset,
}: UseMdActionsOptions) {
  const [submitting, setSubmitting] = React.useState(false);
  const { sendMutation } = useIdempotentSend();
  const queryClient = useQueryClient();

  const invalidateMenuCaches = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: cbsQueries.menuTree.active().queryKey });
  }, [queryClient]);

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
        await invalidateMenuCaches();
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
    invalidateMenuCaches,
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
        await invalidateMenuCaches();
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
  }, [recordId, reset, rebaseline, invalidateMenuCaches, sendMutation]);

  return { submitting, handleSubmit, handleAuthorize };
}
