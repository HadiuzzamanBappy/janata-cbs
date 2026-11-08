"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";

export interface UseFormActionsOptions {
  modelCode: string;
  schema: FormConfigRecord | null;
  searchRecordId: string;
  setSearchRecordId: (id: string) => void;
  screenMode: CbsScreenMode;
  setScreenMode: (mode: CbsScreenMode) => void;
  setValues: (values: Record<string, unknown>) => void;
  resetForm: (values?: Record<string, unknown>) => void;
  validate: () => boolean;
  initialValues: Record<string, unknown>;
  onReturn?: () => void;
}

/**
 * Streamlined, DRY Action Hook for Operational CBS Form Screens.
 * Handles Record Fetching, ID Generation (GNI), Amendments, Views, and Navigations.
 */
export function useFormActions({
  modelCode,
  schema,
  searchRecordId,
  setSearchRecordId,
  screenMode,
  setScreenMode,
  setValues,
  resetForm,
  validate,
  initialValues,
  onReturn,
}: UseFormActionsOptions) {
  // Query record by ID via CBS Client wire protocol
  const loadRecordData = React.useCallback(
    async (recordIdToLoad: string, modeToSet: CbsScreenMode) => {
      const cleanId = recordIdToLoad?.trim();
      if (!schema || !cleanId || !modelCode) return;

      try {
        const res = await cbs.send<Record<string, unknown>>(cbs.model(modelCode).get(cleanId), {
          silent: true,
        });

        if (res.status === "SUCCESS" && res.data) {
          setValues(res.data);
          setScreenMode(modeToSet);
          toast.add({
            title: modeToSet === CbsRecordFunction.SEE ? "Viewing Record" : "Editing Record",
            description: `Loaded record #${cleanId} for ${schema.title}`,
            type: "success",
          });
        } else {
          toast.add({
            title: "Record Not Found",
            description: `Record #${cleanId} does not exist in ${schema.title}.`,
            type: "warning",
          });
        }
      } catch {
        setScreenMode(modeToSet);
      }
    },
    [schema, modelCode, setScreenMode, setValues],
  );

  // Allocate new ID & open in Input mode (I)
  const handleCreateNew = React.useCallback(
    async (allocatedId?: string) => {
      if (!schema || !modelCode) return;
      let nextId = allocatedId;
      if (!nextId) {
        try {
          const gni = await cbs.send<{ recordId?: string }>(cbs.model(modelCode).getNewId());
          if (gni.status === "SUCCESS" && gni.data?.recordId) {
            nextId = gni.data.recordId;
          }
        } catch {
          // GNI failure fallback
        }
      }
      const targetId = (nextId || searchRecordId).trim();
      if (nextId) {
        setSearchRecordId(nextId);
      }
      resetForm(initialValues);
      setScreenMode(CbsRecordFunction.INPUT);
      toast.add({
        title: "New Record Entry",
        description: targetId
          ? `Draft initiated with ID #${targetId}`
          : "Draft initiated for new record.",
        type: "info",
      });
    },
    [schema, resetForm, initialValues, setScreenMode, searchRecordId, modelCode, setSearchRecordId],
  );

  // Target ID resolver helper
  const resolveTargetId = React.useCallback(
    (targetId?: unknown, actionName = "edit"): string | null => {
      const raw = typeof targetId === "string" ? targetId : searchRecordId;
      const id = (typeof raw === "string" ? raw : String(raw || "")).trim();
      if (!id) {
        toast.add({
          title: "Input Required",
          description: `Please enter or select a Record ID to ${actionName}.`,
          type: "warning",
        });
        return null;
      }
      return id;
    },
    [searchRecordId],
  );

  // Edit / Amend record
  const handleAmend = React.useCallback(
    (targetId?: unknown) => {
      const id = resolveTargetId(targetId, "edit");
      if (id) loadRecordData(id, CbsRecordFunction.INPUT);
    },
    [resolveTargetId, loadRecordData],
  );

  // View record
  const handleView = React.useCallback(
    (targetId?: unknown) => {
      const id = resolveTargetId(targetId, "view");
      if (id) loadRecordData(id, CbsRecordFunction.SEE);
    },
    [resolveTargetId, loadRecordData],
  );

  // Perform Action (e.g. Authorize)
  const handlePerformAction = React.useCallback(() => {
    const id = resolveTargetId(undefined, "authorize");
    if (id) loadRecordData(id, CbsRecordFunction.AUTHORIZE);
  }, [resolveTargetId, loadRecordData]);

  // Return to Search
  const handleReturnToSearch = React.useCallback(() => {
    if (onReturn) {
      onReturn();
      return;
    }
    resetForm(initialValues);
    setScreenMode("IDLE");
  }, [onReturn, resetForm, initialValues, setScreenMode]);

  // Validate current form state
  const handleValidate = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema) return undefined;
    return () => {
      const isValid = validate();
      if (!isValid) {
        toast.add({
          title: "Validation Issues",
          description: "Required fields require attention before saving.",
          type: "warning",
        });
        return;
      }
      toast.add({
        title: "Validation Check Passed",
        description: `All rules validated for ${schema.title}`,
        type: "success",
      });
    };
  }, [screenMode, schema, validate]);

  return {
    loadRecordData,
    onCreateNew: handleCreateNew,
    onAmend: handleAmend,
    onView: handleView,
    onPerformAction: handlePerformAction,
    onReturnToSearch: handleReturnToSearch,
    onValidate: handleValidate,
  };
}
