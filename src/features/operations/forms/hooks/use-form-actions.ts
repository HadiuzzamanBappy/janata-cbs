"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type { CompiledFormSpec } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";
import { normalizeRecordData } from "../utils/record-normalizer";
import { useFormMutations } from "./use-form-mutations";

export interface UseFormActionsOptions {
  command: string;
  spec: CompiledFormSpec | null;
  searchRecordId: string;
  setSearchRecordId: (id: string) => void;
  screenMode: CbsScreenMode;
  setScreenMode: (mode: CbsScreenMode) => void;
  values: Record<string, unknown>;
  setValues: (values: Record<string, unknown>) => void;
  setValue: (field: string, val: unknown) => void;
  resetForm: (values?: Record<string, unknown>) => void;
  validate: () => boolean;
  initialValues: Record<string, unknown>;
  onSuccess?: (result: unknown) => void;
  onReturn?: () => void;
}

export function useFormActions({
  command,
  spec,
  searchRecordId,
  setSearchRecordId: _setSearchRecordId,
  screenMode,
  setScreenMode,
  values,
  setValues,
  resetForm,
  validate,
  initialValues,
  onSuccess,
  onReturn,
}: UseFormActionsOptions) {
  const modelCode = (command || "").split(",")[0].trim().toUpperCase();

  // Query record by ID via real CBS Client wire protocol
  const loadRecordData = React.useCallback(
    async (recordIdToLoad: string, modeToSet: CbsScreenMode) => {
      if (!spec || !recordIdToLoad.trim()) return;

      const cleanCode = modelCode;
      const cleanId = recordIdToLoad.trim();

      try {
        const res = await cbs.send<Record<string, unknown>>(
          cbs.form.fetchRecord(cleanCode, cleanId),
          { silent: true },
        );

        if (res.status === "SUCCESS" && res.data) {
          const normalized = normalizeRecordData(res.data, spec);
          setValues(normalized);
          setScreenMode(modeToSet);
          toast.add({
            title: modeToSet === "S" ? "Viewing Record" : "Editing Record",
            description: `Loaded record #${cleanId} for ${spec.title}`,
            type: "success",
          });
        } else {
          toast.add({
            title: "Record Not Found",
            description: `Record #${cleanId} does not exist in ${spec.title}.`,
            type: "warning",
          });
        }
      } catch {
        setScreenMode(modeToSet);
      }
    },
    [spec, modelCode, setScreenMode, setValues],
  );

  const handleCreateNew = React.useCallback(
    async (allocatedId?: string) => {
      if (!spec) return;
      let nextId = allocatedId;
      if (!nextId) {
        try {
          const gni = await cbs.send<{ recordId?: string }>(cbs.form.getNewRecordId(modelCode));
          if (gni.status === "SUCCESS" && gni.data?.recordId) {
            nextId = gni.data.recordId;
          }
        } catch {
          // Fallback sequence
        }
      }
      const targetId = (nextId || searchRecordId).trim();
      if (nextId && _setSearchRecordId) {
        _setSearchRecordId(nextId);
      }
      resetForm(initialValues);
      setScreenMode("I");
      toast.add({
        title: "New Record Entry",
        description: targetId
          ? `Creating new entry #${targetId} for ${spec.title}`
          : `Ready to input new transaction for ${spec.title}`,
        type: "info",
      });
    },
    [spec, resetForm, initialValues, setScreenMode, searchRecordId, modelCode, _setSearchRecordId],
  );

  const handleAmend = React.useCallback(
    (targetId?: unknown) => {
      const raw = typeof targetId === "string" ? targetId : searchRecordId;
      const id = (typeof raw === "string" ? raw : String(raw || "")).trim();
      if (!id) {
        toast.add({
          title: "Input Required",
          description: "Please enter or select a Record ID to edit.",
          type: "warning",
        });
        return;
      }
      loadRecordData(id, "I");
    },
    [searchRecordId, loadRecordData],
  );

  const handleView = React.useCallback(
    (targetId?: unknown) => {
      const raw = typeof targetId === "string" ? targetId : searchRecordId;
      const id = (typeof raw === "string" ? raw : String(raw || "")).trim();
      if (!id) {
        toast.add({
          title: "Input Required",
          description: "Please enter or select a Record ID to view.",
          type: "warning",
        });
        return;
      }
      loadRecordData(id, "S");
    },
    [searchRecordId, loadRecordData],
  );

  const handlePerformAction = React.useCallback(() => {
    const raw = searchRecordId;
    const id = (typeof raw === "string" ? raw : String(raw || "")).trim();
    if (!id) {
      handleCreateNew();
      return;
    }
    loadRecordData(id, "I");
  }, [searchRecordId, handleCreateNew, loadRecordData]);

  const handleReturnToSearch = React.useCallback(() => {
    if (onReturn) {
      onReturn();
      return;
    }
    resetForm(initialValues);
    setScreenMode("IDLE");
  }, [onReturn, resetForm, initialValues, setScreenMode]);

  const handleValidate = React.useMemo(() => {
    if (screenMode === "IDLE" || !spec) return undefined;
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
        description: `All rules validated for ${spec.title}`,
        type: "success",
      });
    };
  }, [screenMode, spec, validate]);

  const mutations = useFormMutations({
    command,
    spec,
    searchRecordId,
    screenMode,
    setScreenMode,
    values,
    initialValues,
    validate,
    resetForm,
    loadRecordData,
    onSuccess,
  });

  return {
    ...mutations,
    loadRecordData,
    onCreateNew: handleCreateNew,
    onAmend: handleAmend,
    onView: handleView,
    onPerformAction: handlePerformAction,
    onReturnToSearch: handleReturnToSearch,
    onValidate: handleValidate,
  };
}
