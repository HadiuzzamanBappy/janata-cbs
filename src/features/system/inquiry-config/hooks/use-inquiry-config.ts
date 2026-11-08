"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import { parseInquiryConfig } from "@/lib/data-parsers";
import type { CbsWirePayload } from "@/lib/data-schemas";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction, CbsRequestType, type CbsScreenMode } from "@/types";
import { type InquiryValidationErrorItem, validateInquiryConfig } from "./ic-validation";
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
    baseline,
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
  const [rawRecord, setRawRecord] = React.useState<unknown>(undefined);
  const [validationErrors, setValidationErrors] = React.useState<InquiryValidationErrorItem[]>([]);

  // 1. Reset screen to idle state
  const resetToIdle = React.useCallback(() => {
    reset();
    setValidationErrors([]);
    setRawRecord(undefined);
  }, [reset]);

  // 2. Initialize new inquiry draft
  const initDraft = React.useCallback(
    (cleanId: string) => {
      const draft: InquiryConfigRecord = {
        ...INITIAL_INQUIRY_CONFIG,
        INQInfo: {
          ...INITIAL_INQUIRY_CONFIG.INQInfo,
          description: "",
          controllerName: cleanId.replace(/[.-]/g, "_").toUpperCase(),
        },
      };
      hydrate(draft);
      setRecordId(cleanId);
      setMode(CbsRecordFunction.INPUT);
      setValidationErrors([]);
    },
    [hydrate, setRecordId, setMode],
  );

  // 3. Load record from backend or fixtures
  const loadRecord = React.useCallback(
    async (idToLoad: string, targetMode: CbsScreenMode = CbsRecordFunction.SEE) => {
      if (!idToLoad) return;
      setLoading(true);
      try {
        const res = await cbs.send<unknown>(cbs.inquiryConfig.get(idToLoad));
        if (res.status === "SUCCESS" && res.data) {
          setRawRecord(res.data);
          const parsed = parseInquiryConfig(res.data);
          const cleanData = parsed.success ? parsed.data : (res.data as InquiryConfigRecord);
          hydrate(cleanData);
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
      loadRecord(resolvedInitialId, resolvedInitialMode || CbsRecordFunction.SEE);
    }
  }, [resolvedInitialId, resolvedInitialMode, loadRecord]);

  // 5. Validate against canonical schema and CBS domain rules
  const handleValidate = React.useCallback((): boolean => {
    const issues = validateInquiryConfig(formData);
    if (issues.length > 0) {
      setValidationErrors(issues);
      toast.add({
        title: "Validation Issues Found",
        description: `${issues.length} issue${issues.length > 1 ? "s" : ""} require your attention.`,
        type: "warning",
      });
      return false;
    }
    setValidationErrors([]);
    toast.add({
      title: "Validation Successful",
      description: "All inquiry specifications, criteria, and column definitions verified (✓).",
      type: "success",
    });
    return true;
  }, [formData]);

  // Clear validation errors when switching away from edit mode
  React.useEffect(() => {
    if (mode !== CbsRecordFunction.INPUT) {
      setValidationErrors([]);
    }
  }, [mode]);

  // 6. Submit handler
  const handleSubmit = React.useCallback(
    async (funcCode: string = CbsRecordFunction.INPUT) => {
      const isValid = handleValidate();
      if (!isValid) return false;

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
    [formData, recordId, rebaseline, upsertCatalogItem, handleValidate, resetToIdle, setMode],
  );

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    baseline,
    loading,
    submitting,
    rawRecord,
    isDirty,
    dirtyKeys,
    validationErrors,
    clearValidationErrors: () => setValidationErrors([]),
    inquiriesPool,
    refreshCatalog,
    resetToIdle,
    initDraft,
    loadRecord,
    handleValidate,
    handleSubmit,
    filterOps,
    columnOps,
    actionOps,
  };
}
