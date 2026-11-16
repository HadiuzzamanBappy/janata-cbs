"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { parseInquiryConfig } from "@/lib/data-parsers";
import { CBS_IDLE_MODE, CbsRecordFunction, type CbsScreenMode } from "@/types";
import { type InquiryValidationErrorItem, validateInquiryConfig } from "./ic-validation";
import { useIcActionOps } from "./use-ic-action-ops";
import { useIcActions } from "./use-ic-actions";
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

  const filterOps = useIcFilterOps(setFormData);
  const columnOps = useIcColumnOps(setFormData);
  const actionOps = useIcActionOps(setFormData);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [rawRecord, setRawRecord] = React.useState<unknown>(undefined);
  const [validationErrors, setValidationErrors] = React.useState<InquiryValidationErrorItem[]>([]);

  // 1. Reset screen to idle state
  const resetToIdle = React.useCallback(() => {
    reset();
    setValidationErrors([]);
    setRawRecord(undefined);
  }, [reset]);

  // 2. Initialize new inquiry draft (the inquiry ID is NOT the target controller)
  const initDraft = React.useCallback(
    (cleanId: string) => {
      hydrate({ ...INITIAL_INQUIRY_CONFIG, INQInfo: { ...INITIAL_INQUIRY_CONFIG.INQInfo } });
      setRawRecord(undefined);
      setRecordId(cleanId);
      setMode(CbsRecordFunction.INPUT);
      setValidationErrors([]);
      toast.add({
        title: "New Inquiry Draft",
        description: `#${cleanId} does not exist yet. Configure it and commit to create.`,
        type: "info",
      });
    },
    [hydrate, setRecordId, setMode],
  );

  // 3. Load the maintenance record (bypasses the runtime schema cache).
  // recordFunction travels on the wire so the core serves the INAU copy for I/A.
  const loadRecord = React.useCallback(
    async (idToLoad: string, targetMode: CbsScreenMode = CbsRecordFunction.SEE) => {
      const cleanId = (idToLoad || "").trim().toUpperCase();
      if (!cleanId) return;
      setLoading(true);
      try {
        const recordFunction = targetMode === CBS_IDLE_MODE ? CbsRecordFunction.SEE : targetMode;
        const res = await cbs.send<unknown>(cbs.inquiryConfig.get(cleanId, { recordFunction }), {
          silent: true,
        });

        if (res.status === "SUCCESS" && res.data) {
          const parsed = parseInquiryConfig(res.data);
          if (!parsed.success) {
            toast.add({
              title: "Invalid Inquiry Record",
              description: parsed.error,
              type: "error",
            });
            return;
          }
          setRawRecord(res.data);
          hydrate(parsed.data);
          setRecordId(cleanId);
          setMode(targetMode);
          setValidationErrors([]);
          return;
        }

        if (res.statusCode === 404 && targetMode === CbsRecordFunction.INPUT) {
          initDraft(cleanId);
          return;
        }

        toast.add({
          title: res.statusCode === 404 ? "Record Not Found" : "Load Failed",
          description: res.message || `Inquiry configuration "${cleanId}" could not be loaded.`,
          type: "error",
        });
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
    [hydrate, initDraft, setMode, setRecordId],
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

  // 6. Action operations via specialized hook
  const { submitting, handleSubmit } = useIcActions({
    formData,
    recordId,
    handleValidate,
    rebaseline,
    resetToIdle,
    setMode,
    setValidationErrors,
  });

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
