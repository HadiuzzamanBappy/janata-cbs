"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbsQueries } from "@/lib/cbs-client";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
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

  const queryClient = useQueryClient();
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
      const cleanId = (idToLoad || "").trim().toUpperCase();
      if (!cleanId) return;
      setLoading(true);
      try {
        const record = await queryClient.fetchQuery(cbsQueries.inquiryConfig.schema(cleanId));
        if (record) {
          setRawRecord(record);
          hydrate(record);
          setRecordId(cleanId);
          setMode(targetMode);
          setValidationErrors([]);
        } else {
          toast.add({
            title: "Record Not Found",
            description: `Inquiry configuration "${cleanId}" does not exist in the database.`,
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
    [hydrate, queryClient, setMode, setRecordId],
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
