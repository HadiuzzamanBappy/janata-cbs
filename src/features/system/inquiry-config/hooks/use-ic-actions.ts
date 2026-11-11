"use client";

import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { sanitizeInquiryConfigRecord } from "@/lib/data-parsers";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import type { InquiryValidationErrorItem } from "./ic-validation";

export interface UseIcActionsOptions {
  formData: InquiryConfigRecord;
  recordId: string;
  handleValidate: () => boolean;
  upsertCatalogItem: (id: string, record: InquiryConfigRecord) => void;
  rebaseline: () => void;
  resetToIdle: () => void;
  setMode: (mode: CbsScreenMode) => void;
  setValidationErrors: (errors: InquiryValidationErrorItem[]) => void;
}

export function useIcActions({
  formData,
  recordId,
  handleValidate,
  upsertCatalogItem,
  rebaseline,
  resetToIdle,
  setMode,
  setValidationErrors,
}: UseIcActionsOptions) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const { sendMutation } = useIdempotentSend();

  const handleSubmit = React.useCallback(
    async (funcCode: string = CbsRecordFunction.INPUT) => {
      if (!handleValidate()) return false;

      setSubmitting(true);
      try {
        const sanitized = sanitizeInquiryConfigRecord(formData) || formData;
        const targetId = recordId || formData.INQInfo?.controllerName || "NEW";

        const payload =
          funcCode === CbsRecordFunction.AUTHORIZE
            ? cbs.inquiryConfig.authorize(targetId)
            : funcCode === CbsRecordFunction.DELETE
              ? cbs.inquiryConfig.delete(targetId)
              : funcCode === CbsRecordFunction.HOLD
                ? cbs.inquiryConfig.hold(targetId)
                : funcCode === CbsRecordFunction.REVERSE
                  ? cbs.inquiryConfig.reverse(targetId)
                  : cbs.inquiryConfig.save(sanitized as unknown as Record<string, unknown>, {
                      recordId: targetId,
                    });

        const res = await sendMutation(payload);
        if (res.status === "SUCCESS" || res.success) {
          toast.add({
            title: "Operation Successful",
            description: `Inquiry ${targetId} processed successfully (${funcCode}).`,
            type: "success",
          });

          upsertCatalogItem(targetId, sanitized);
          rebaseline();
          broadcastRecordMutation("INQUIRY", targetId);
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
      upsertCatalogItem,
      rebaseline,
      setValidationErrors,
      setMode,
      resetToIdle,
      sendMutation,
    ],
  );

  return { submitting, handleSubmit };
}
