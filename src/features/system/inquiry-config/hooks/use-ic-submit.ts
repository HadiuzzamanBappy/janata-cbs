"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { sanitizeInquiryConfigRecord } from "@/lib/data-parsers";
import type { CbsWirePayload } from "@/lib/data-schemas";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction, CbsRequestType, type CbsScreenMode } from "@/types";
import type { InquiryValidationErrorItem } from "./ic-validation";

export interface UseIcSubmitOptions {
  formData: InquiryConfigRecord;
  recordId: string;
  handleValidate: () => boolean;
  upsertCatalogItem: (id: string, record: InquiryConfigRecord) => void;
  rebaseline: () => void;
  resetToIdle: () => void;
  setMode: (mode: CbsScreenMode) => void;
  setValidationErrors: (errors: InquiryValidationErrorItem[]) => void;
}

export function useIcSubmit({
  formData,
  recordId,
  handleValidate,
  upsertCatalogItem,
  rebaseline,
  resetToIdle,
  setMode,
  setValidationErrors,
}: UseIcSubmitOptions) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const handleSubmit = React.useCallback(
    async (funcCode: string = CbsRecordFunction.INPUT) => {
      if (!handleValidate()) return false;

      setSubmitting(true);
      try {
        const sanitized = sanitizeInquiryConfigRecord(formData) || formData;
        const payload: CbsWirePayload = {
          requestType:
            funcCode === CbsRecordFunction.AUTHORIZE
              ? CbsRequestType.AUT
              : funcCode === CbsRecordFunction.DELETE
                ? CbsRequestType.DEL
                : CbsRequestType.PUT,
          controlName: "INQUIRY",
          recordFunction: funcCode,
          recordId: recordId || formData.INQInfo?.controllerName || "NEW",
          data: sanitized as unknown as Record<string, unknown>,
        };

        const res = await cbs.send(payload);
        if (res.status === "SUCCESS" || res.success) {
          toast.add({
            title: "Operation Successful",
            description: `Inquiry ${recordId} processed successfully (${funcCode}).`,
            type: "success",
          });

          upsertCatalogItem(recordId, sanitized);
          rebaseline();
          broadcastRecordMutation("INQUIRY", recordId);
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
    ],
  );

  return { submitting, handleSubmit };
}
