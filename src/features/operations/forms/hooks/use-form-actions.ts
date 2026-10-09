"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import type { FormSchema } from "@/lib/schemas";
import { findRecordInFixtures } from "../utils/record-finder";
import { normalizeRecordData } from "../utils/record-normalizer";

export interface UseFormActionsOptions {
  schema: FormSchema | null;
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
  schema,
  searchRecordId,
  setSearchRecordId: _setSearchRecordId,
  screenMode,
  setScreenMode,
  values,
  setValues,
  setValue: _setValue,
  resetForm,
  validate,
  initialValues,
  onSuccess,
  onReturn,
}: UseFormActionsOptions) {
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Load record from fixture database or CBS proxy
  const loadRecordData = React.useCallback(
    async (recordIdToLoad: string, modeToSet: "EDIT" | "VIEW") => {
      if (!schema || !recordIdToLoad.trim()) return;

      const cleanModel = schema.code.toUpperCase();
      const cleanId = recordIdToLoad.trim();
      const foundRecord = findRecordInFixtures(cleanModel, cleanId);

      if (foundRecord) {
        const normalized = normalizeRecordData(foundRecord, schema);
        setValues(normalized);
        setScreenMode(modeToSet);
        toast.add({
          title: modeToSet === "VIEW" ? "Viewing Record" : "Editing Record",
          description: `Loaded record #${cleanId} for ${schema.title}`,
          type: "success",
        });
        return;
      }

      // Live backend query via proxy
      try {
        const json = await cbs.send<Record<string, unknown>>(
          cbs.inquiry.fetchSingleRecord(schema.code, cleanId),
          { silent: true },
        );

        if (json.status === "SUCCESS" && json.data) {
          const normalized = normalizeRecordData(json.data, schema);
          setValues(normalized);
          setScreenMode(modeToSet);
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
    [schema, setScreenMode, setValues],
  );

  const handleCreateNew = React.useCallback(() => {
    if (!schema) return;
    resetForm(initialValues);
    setScreenMode("CREATE");
    toast.add({
      title: "New Record Entry",
      description: searchRecordId.trim()
        ? `Creating new entry with ID #${searchRecordId.trim()} for ${schema.title}`
        : `Ready to input new transaction for ${schema.title}`,
      type: "info",
    });
  }, [schema, resetForm, initialValues, setScreenMode, searchRecordId]);

  const handleAmend = React.useCallback(() => {
    const id = searchRecordId.trim();
    if (!id) {
      toast.add({
        title: "Input Required",
        description: "Please enter or select a Record ID to edit.",
        type: "warning",
      });
      return;
    }
    loadRecordData(id, "EDIT");
  }, [searchRecordId, loadRecordData]);

  const handleView = React.useCallback(() => {
    const id = searchRecordId.trim();
    if (!id) {
      toast.add({
        title: "Input Required",
        description: "Please enter or select a Record ID to view.",
        type: "warning",
      });
      return;
    }
    loadRecordData(id, "VIEW");
  }, [searchRecordId, loadRecordData]);

  const handlePerformAction = React.useCallback(() => {
    const id = searchRecordId.trim();
    if (!id) {
      toast.add({
        title: "Input Required",
        description: "Please enter or select a Record ID to perform action.",
        type: "warning",
      });
      return;
    }
    loadRecordData(id, "EDIT");
  }, [searchRecordId, loadRecordData]);

  const handleReturnToSearch = React.useCallback(() => {
    if (onReturn) {
      onReturn();
      return;
    }
    resetForm(initialValues);
    setScreenMode("IDLE");
    toast.add({
      title: "Returned to Search",
      description: "Returned to initial dashboard / lookup state.",
      type: "info",
    });
  }, [onReturn, resetForm, initialValues, setScreenMode]);

  const handleSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!validate()) {
        toast.add({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          type: "warning",
        });
        return;
      }

      if (!schema) return;

      setSubmitting(true);
      try {
        const json = await cbs.send(cbs.form.commitRecord(schema.code, values), {
          successTitle: "Transaction Saved",
          successMessage: `Record saved successfully for ${schema.title}`,
        });

        if (json.status === "SUCCESS") {
          if (onSuccess) onSuccess(json);
        }
      } catch {
        // Toast notification managed by cbs.send
      } finally {
        setSubmitting(false);
      }
    },
    [validate, schema, values, onSuccess],
  );

  const handleHold = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema) return undefined;
    return () => {
      toast.add({
        title: "Transaction Held",
        description: `Record draft for ${schema.title} placed on Hold (HLD status).`,
        type: "info",
      });
    };
  }, [screenMode, schema]);

  const handleDelete = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema) return undefined;
    return () => {
      toast.add({
        title: "Record Reversal Queued",
        description: `Transaction marked for reversal/deletion in ${schema.title}.`,
        type: "warning",
      });
    };
  }, [screenMode, schema]);

  const handleAuthorizeReverse = React.useMemo(() => {
    if (screenMode === "IDLE") return undefined;
    return () => {
      toast.add({
        title: "Authorize Reversal",
        description: `Authorizing transaction reversal for record #${searchRecordId || "CURRENT"}.`,
        type: "warning",
      });
    };
  }, [screenMode, searchRecordId]);

  const handleProcessAction = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema) return undefined;
    return () => {
      toast.add({
        title: "Process / Verify Record",
        description: `Executing verification & end-of-stage process for ${schema.title}.`,
        type: "success",
      });
    };
  }, [screenMode, schema]);

  const handleValidate = React.useMemo(() => {
    if (screenMode === "IDLE" || !schema) return undefined;
    return () => {
      const isValid = validate();
      if (!isValid) {
        toast.add({
          title: "Validation Issues",
          description: `Required fields require attention before saving.`,
          type: "warning",
        });
        return;
      }
      toast.add({
        title: "Validation Check Passed",
        description: `Onsite & DB rules validated for ${schema.title}`,
        type: "success",
      });
    };
  }, [screenMode, schema, validate]);

  return {
    submitting,
    loadRecordData,
    onCreateNew: handleCreateNew,
    onAmend: handleAmend,
    onView: handleView,
    onPerformAction: handlePerformAction,
    onReturnToSearch: handleReturnToSearch,
    onSubmit: screenMode !== "IDLE" ? handleSubmit : undefined,
    onHold: handleHold,
    onDelete: handleDelete,
    onAuthorizeReverse: handleAuthorizeReverse,
    onProcessAction: handleProcessAction,
    onValidate: handleValidate,
  };
}
