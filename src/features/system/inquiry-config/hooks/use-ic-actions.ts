"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs, cbsQueries } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { sanitizeInquiryConfigRecord } from "@/lib/data-parsers";
import { type InquiryConfigRecord, isApiSuccess } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, type CbsScreenMode } from "@/types";
import type { InquiryValidationErrorItem } from "./ic-validation";

export interface UseIcActionsOptions {
  formData: InquiryConfigRecord;
  recordId: string;
  handleValidate: () => boolean;
  rebaseline: () => void;
  resetToIdle: () => void;
  setMode: (mode: CbsScreenMode) => void;
  setValidationErrors: (errors: InquiryValidationErrorItem[]) => void;
}

export function useIcActions({
  formData,
  recordId,
  handleValidate,
  rebaseline,
  resetToIdle,
  setMode,
  setValidationErrors,
}: UseIcActionsOptions) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const { sendMutation } = useIdempotentSend();
  const queryClient = useQueryClient();

  const handleSubmit = React.useCallback(
    async (funcCode: CbsRecordFunction = CbsRecordFunction.INPUT) => {
      // The record key is the inquiry ID (e.g. GET.BRANCH) — never the target controller.
      const targetId = recordId.trim().toUpperCase();
      if (!targetId) {
        toast.add({
          title: "Missing Inquiry ID",
          description: "Enter or open an inquiry ID before performing this operation.",
          type: "error",
        });
        return false;
      }

      // Only a commit (I) needs a complete definition; H parks work-in-progress,
      // and A/D/R act on the stored record, not on the form.
      if (funcCode === CbsRecordFunction.INPUT && !handleValidate()) return false;

      setSubmitting(true);
      try {
        const sanitized = (sanitizeInquiryConfigRecord(formData) || formData) as unknown as Record<
          string,
          unknown
        >;

        const payload =
          funcCode === CbsRecordFunction.AUTHORIZE
            ? cbs.inquiryConfig.authorize(targetId)
            : funcCode === CbsRecordFunction.DELETE
              ? cbs.inquiryConfig.delete(targetId)
              : funcCode === CbsRecordFunction.HOLD
                ? cbs.inquiryConfig.hold(targetId, sanitized)
                : funcCode === CbsRecordFunction.REVERSE
                  ? cbs.inquiryConfig.reverse(targetId)
                  : cbs.inquiryConfig.save(sanitized, { recordId: targetId });

        const res = await sendMutation(payload);
        if (isApiSuccess(res)) {
          toast.add({
            title: "Operation Successful",
            description: `Inquiry ${targetId} processed successfully (${funcCode}).`,
            type: "success",
          });

          rebaseline();
          broadcastRecordMutation(CbsControlTable.INQUIRY_CONFIG, targetId);
          await queryClient.invalidateQueries({ queryKey: cbsQueries.inquiryConfig.schemaRootKey });
          setValidationErrors([]);

          if (funcCode === CbsRecordFunction.HOLD) {
            setMode(CbsRecordFunction.HOLD);
          } else {
            resetToIdle();
          }
          return true;
        }

        toast.add({
          title: "Operation Failed",
          description: res.message || "Backend rejected the operation.",
          type: "error",
        });
        return false;
      } catch (err: unknown) {
        toast.add({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to submit inquiry record",
          type: "error",
        });
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [
      formData,
      recordId,
      handleValidate,
      rebaseline,
      queryClient,
      setValidationErrors,
      setMode,
      resetToIdle,
      sendMutation,
    ],
  );

  return { submitting, handleSubmit };
}
