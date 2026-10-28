"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import type { CbsWirePayload } from "@/lib/data-schemas";
import {
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction, CbsRequestType, type CbsScreenMode } from "@/types";
import {
  type InquiryValidationErrorItem,
  mapZodIssuesToInquiryValidationErrors,
} from "./ic-validation";
import { useIcActionOps } from "./use-ic-action-ops";
import { useIcCatalog } from "./use-ic-catalog";
import { useIcColumnOps } from "./use-ic-column-ops";
import { useIcFilterOps } from "./use-ic-filter-ops";
import { INITIAL_INQUIRY_CONFIG, useIcPersistence } from "./use-ic-persistence";

export function useInquiryConfig(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    hydrate,
    rebaseline,
    reset,
    isDirty,
    dirtyKeys,
    resolvedInitialId,
    resolvedInitialMode,
  } = useIcPersistence(initialId, tabId);

  const { inquiriesPool, refreshCatalog, upsertCatalogItem } = useIcCatalog();
  const filterOps = useIcFilterOps(setFormData);
  const columnOps = useIcColumnOps(setFormData);
  const actionOps = useIcActionOps(setFormData);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [validationErrors, setValidationErrors] = React.useState<InquiryValidationErrorItem[]>([]);

  // 1. Reset screen to idle state
  const resetToIdle = React.useCallback(() => {
    reset();
    setValidationErrors([]);
  }, [reset]);

  // 2. Initialize new inquiry draft
  const initDraft = React.useCallback(
    (cleanId: string) => {
      const draft: InquiryConfigRecord = {
        ...INITIAL_INQUIRY_CONFIG,
        INQInfo: {
          ...INITIAL_INQUIRY_CONFIG.INQInfo,
          description: cleanId.replace(/[_.-]/g, " "),
          controllerName: cleanId.replace(/[.-]/g, "_").toUpperCase(),
        },
      };
      hydrate(draft);
      setRecordId(cleanId);
      setMode("I");
      setValidationErrors([]);
    },
    [hydrate, setRecordId, setMode],
  );

  // 3. Load record from backend or fixtures
  const loadRecord = React.useCallback(
    async (idToLoad: string, targetMode: CbsScreenMode = "S") => {
      if (!idToLoad) return;
      setLoading(true);
      try {
        const res = await cbs.send<InquiryConfigRecord>(cbs.inquiryConfig.get(idToLoad));
        if (res.status === "SUCCESS" && res.data) {
          hydrate(res.data);
          setRecordId(idToLoad);
          setMode(targetMode);
          setValidationErrors([]);
        } else {
          toast.add({
            title: "Record Not Found",
            description: `Inquiry configuration "${idToLoad}" does not exist in the database.`,
            type: "error",
          });
        }
      } catch (err: unknown) {
        toast.add({
          title: "Network Error",
          description: err instanceof Error ? err.message : "Failed to load inquiry record",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [hydrate, setRecordId, setMode],
  );

  // 4. Initial auto-load
  React.useEffect(() => {
    if (resolvedInitialId) {
      loadRecord(resolvedInitialId, resolvedInitialMode || "S");
    }
  }, [resolvedInitialId, resolvedInitialMode, loadRecord]);

  // 5. Submit handler (PUT for Maker, AUT for Checker, DEL for Delete)
  const handleSubmit = React.useCallback(
    async (funcCode: string = CbsRecordFunction.INPUT) => {
      // Validate with canonical schema before dispatch
      const parseResult = inquiryConfigRecordSchema.safeParse(formData);
      if (!parseResult.success) {
        const errors = mapZodIssuesToInquiryValidationErrors(parseResult.error);
        setValidationErrors(errors);
        toast.add({
          title: "Validation Failed",
          description: `Found ${errors.length} validation issue(s). Please review your settings.`,
          type: "error",
        });
        return false;
      }

      setSubmitting(true);
      try {
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
          data: formData as unknown as Record<string, unknown>,
        };

        const res = await cbs.send(payload);
        if (res.status === "SUCCESS" || res.success) {
          toast.add({
            title: "Operation Successful",
            description: `Inquiry ${recordId} processed successfully (${funcCode}).`,
            type: "success",
          });

          upsertCatalogItem(recordId, formData);
          rebaseline();
          broadcastRecordMutation("INQUIRY", recordId);
          setValidationErrors([]);
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
    [formData, recordId, rebaseline, upsertCatalogItem],
  );

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    loading,
    submitting,
    isDirty,
    dirtyKeys,
    validationErrors,
    inquiriesPool,
    refreshCatalog,
    resetToIdle,
    initDraft,
    loadRecord,
    handleSubmit,

    // Sub-domain operation handlers
    filterOps,
    columnOps,
    actionOps,
  };
}
