"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { recordFunctionOfMode } from "@/lib/cbs-access";
import { cbs } from "@/lib/cbs-client";
import { normalizeRecordDates } from "@/lib/cbs-form-spec";
import { useRecordMutationSubscriber } from "@/lib/cbs-screen";
import { CBS_API_STATUS, type FormConfigRecord, isApiSuccess } from "@/lib/data-schemas";
import { CBS_IDLE_MODE, CbsRecordFunction, type CbsScreenMode } from "@/types";

export interface UseFormActionsProps {
  modelCode: string;
  schema: FormConfigRecord | null;
  searchRecordId: string;
  setSearchRecordId: (id: string) => void;
  screenMode: CbsScreenMode;
  setScreenMode: (mode: CbsScreenMode) => void;
  hydrate: (record: Record<string, unknown>) => void;
  clearForm: () => void;
  validate: () => boolean;
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
  hydrate,
  clearForm,
  validate,
}: UseFormActionsProps) {
  // Query record by ID. Only a loaded record changes the screen: a failure keeps it as it is.
  const loadRecordData = React.useCallback(
    async (recordIdToLoad: string, modeToSet: CbsScreenMode) => {
      const cleanId = recordIdToLoad?.trim();
      if (!schema || !cleanId || !modelCode) return;

      try {
        const res = await cbs.send<Record<string, unknown>>(
          cbs.model(modelCode).get(cleanId, { recordFunction: recordFunctionOfMode(modeToSet) }),
          { silent: true },
        );

        if (isApiSuccess(res) && res.data) {
          // Inbound dates become ISO once, here, so the baseline and every later save are ISO
          hydrate(normalizeRecordDates(schema, res.data));
          setScreenMode(modeToSet);
          if (cleanId !== searchRecordId) {
            setSearchRecordId(cleanId);
          }
          const toastTitle =
            modeToSet === CbsRecordFunction.AUTHORIZE
              ? "Authorizing Record"
              : modeToSet === CbsRecordFunction.SEE
                ? "Viewing Record"
                : "Editing Record";

          toast.add({
            title: toastTitle,
            description: `Loaded record #${cleanId} for ${schema.title}`,
            type: "success",
          });
          return;
        }

        // A missing record and a failed read are told apart, so an outage never reads as "not found"
        const notFound =
          isApiSuccess(res) ||
          res.status === CBS_API_STATUS.RECORD_NOT_FOUND ||
          res.statusCode === 404;
        toast.add(
          notFound
            ? {
                title: "Record Not Found",
                description: `Record #${cleanId} does not exist in ${schema.title}.`,
                type: "warning",
              }
            : {
                title: "Record Could Not Be Loaded",
                description: res.message || `Failed to load record #${cleanId}.`,
                type: "error",
              },
        );
      } catch {
        // cbs.send already reported it (session expiry) or it was aborted; keep the screen as it is
      }
    },
    [schema, modelCode, setScreenMode, hydrate, searchRecordId, setSearchRecordId],
  );

  // Auto-fetch record data when opened with initial query/mode
  const lastLoadedKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!schema) return;
    const cleanId = searchRecordId?.trim();
    if (cleanId && screenMode !== CBS_IDLE_MODE) {
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

  /** A new entry: an empty record and an empty baseline, so its save sends every field. */
  const handleCreateNew = React.useCallback(
    (allocatedId?: string) => {
      if (!schema || !modelCode) return;
      const targetId = (allocatedId || searchRecordId || "").trim();
      clearForm();
      if (targetId) setSearchRecordId(targetId);
      setScreenMode(CbsRecordFunction.INPUT);
      toast.add({
        title: "New Record Entry",
        description: targetId
          ? `Draft initiated with ID #${targetId}`
          : "Draft initiated for new record.",
        type: "info",
      });
    },
    [schema, clearForm, setScreenMode, searchRecordId, modelCode, setSearchRecordId],
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

  const handleValidate = React.useMemo(() => {
    if (screenMode === CBS_IDLE_MODE || !schema) return undefined;
    return () => {
      if (!validate()) return;
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
    handleValidate,
  };
}
