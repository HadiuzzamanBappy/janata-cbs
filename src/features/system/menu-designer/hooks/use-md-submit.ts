"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { serializeMenuTreeToWireJson } from "@/lib/data-parsers";
import type {
  MenuDesignerValidationError,
  MenuTreeRecord,
} from "@/lib/data-schemas/menu-designer-schema";

export interface UseMdSubmitOptions {
  formData: MenuTreeRecord;
  recordId: string;
  handleValidate: () => boolean;
  rebaseline: () => void;
  refetchTrees: () => void;
  setValidationErrors: (errors: MenuDesignerValidationError[]) => void;
  reset: () => void;
}

export function useMdSubmit({
  formData,
  recordId,
  handleValidate,
  rebaseline,
  refetchTrees,
  setValidationErrors,
  reset,
}: UseMdSubmitOptions) {
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return false;

    setSubmitting(true);
    try {
      const wireData = serializeMenuTreeToWireJson(formData);
      const json = await cbs.send(
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
  }, [formData, recordId, reset, rebaseline, refetchTrees, handleValidate, setValidationErrors]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId.trim()) return false;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.menuTree.authorize(recordId.trim().toUpperCase()), {
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
  }, [recordId, reset, rebaseline, refetchTrees]);

  return { submitting, handleSubmit, handleAuthorize };
}
