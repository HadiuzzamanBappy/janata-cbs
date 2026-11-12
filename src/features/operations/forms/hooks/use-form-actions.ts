"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { useRecordMutationSubscriber } from "@/lib/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";

export interface UseFormActionsProps {
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
 * Handles record lifecycle actions: Auto-fetch, GNI sequence, Amend, View, and Validate.
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
}: UseFormActionsProps) {
  // Query record by ID
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

  // Auto-fetch record data when opened with initial query/mode
  const lastLoadedKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!schema) return;
    const cleanId = searchRecordId?.trim();
    if (cleanId && screenMode !== "IDLE") {
      const loadKey = `${modelCode}:${cleanId}:${screenMode}`;
      if (lastLoadedKeyRef.current === loadKey) return;
      lastLoadedKeyRef.current = loadKey;
      loadRecordData(cleanId, screenMode);
    }
  }, [schema, searchRecordId, screenMode, modelCode, loadRecordData]);

  // Real-time record mutation subscriber
  useRecordMutationSubscriber((mutation) => {
    if (searchRecordId && mutation.recordId === searchRecordId.trim().toUpperCase()) {
      loadRecordData(searchRecordId, screenMode);
    }
  }, modelCode);

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

  const handleCreateNew = React.useCallback(
    (allocatedId?: string) => {
      if (!schema || !modelCode) return;
      const targetId = (allocatedId || searchRecordId || "").trim();
      if (allocatedId) setSearchRecordId(allocatedId.trim());
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

  const handleAmend = React.useCallback(
    (targetId?: unknown) => {
      const id = resolveTargetId(targetId, "edit");
      if (id) loadRecordData(id, CbsRecordFunction.INPUT);
    },
    [resolveTargetId, loadRecordData],
  );

  const handleView = React.useCallback(
    (targetId?: unknown) => {
      const id = resolveTargetId(targetId, "view");
      if (id) loadRecordData(id, CbsRecordFunction.SEE);
    },
    [resolveTargetId, loadRecordData],
  );

  const handlePerformAction = React.useCallback(() => {
    const id = resolveTargetId(undefined, "authorize");
    if (id) loadRecordData(id, CbsRecordFunction.AUTHORIZE);
  }, [resolveTargetId, loadRecordData]);

  const handleReturnToSearch = React.useCallback(() => {
    if (onReturn) {
      onReturn();
      return;
    }
    resetForm(initialValues);
    setScreenMode("IDLE");
  }, [onReturn, resetForm, initialValues, setScreenMode]);

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
    handleCreateNew,
    handleAmend,
    handleView,
    handlePerformAction,
    handleReturnToSearch,
    handleValidate,
    loadRecordData,
  };
}
