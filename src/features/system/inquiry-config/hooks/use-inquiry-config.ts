"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type {
  InquiryColumnConfig,
  InquiryConfigRecord,
} from "@/lib/data-schemas/inquiry-config-schema";
import { useWorkbenchStore } from "@/store";
import {
  INITIAL_INQUIRY_CONFIG,
  useInquiryConfigPersistence,
} from "./use-inquiry-config-persistence";

export function useInquiryConfig(initialId?: string, tabId?: string) {
  const setTabDirty = useWorkbenchStore((state) => state.setTabDirty);

  const { recordId, setRecordId, mode, setMode, formData, setFormData, updateConfig } =
    useInquiryConfigPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const addColumn = React.useCallback(
    (column: InquiryColumnConfig) => {
      updateConfig({
        columns: [...formData.columns, column],
      });
    },
    [formData.columns, updateConfig],
  );

  const updateColumn = React.useCallback(
    (index: number, patch: Partial<InquiryColumnConfig>) => {
      const nextCols = [...formData.columns];
      if (nextCols[index]) {
        nextCols[index] = { ...nextCols[index], ...patch };
        updateConfig({ columns: nextCols });
      }
    },
    [formData.columns, updateConfig],
  );

  const removeColumn = React.useCallback(
    (index: number) => {
      const nextCols = formData.columns.filter((_, i) => i !== index);
      updateConfig({ columns: nextCols });
    },
    [formData.columns, updateConfig],
  );

  const reorderColumns = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex < 0 ||
        fromIndex >= formData.columns.length ||
        toIndex < 0 ||
        toIndex >= formData.columns.length
      )
        return;
      const nextCols = [...formData.columns];
      const [moved] = nextCols.splice(fromIndex, 1);
      nextCols.splice(toIndex, 0, moved);
      updateConfig({ columns: nextCols });
    },
    [formData.columns, updateConfig],
  );

  const fetchRecord = React.useCallback(
    async (targetId: string) => {
      if (!targetId.trim()) return;
      setLoading(true);
      try {
        const payload = cbs.inquiryConfig.get(targetId);
        const res = await cbs.send<InquiryConfigRecord>(payload);
        if (res.status === "SUCCESS" && res.data) {
          setFormData(res.data);
          setRecordId(targetId);
          if (tabId) setTabDirty(tabId, false);
        } else {
          toast.add({
            title: "Record Not Found",
            description: res.message || `No inquiry configuration for '${targetId}'`,
            type: "info",
          });
        }
      } catch (err: unknown) {
        toast.add({
          title: "Fetch Error",
          description: err instanceof Error ? err.message : "Error fetching record",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [setFormData, setRecordId, tabId, setTabDirty],
  );

  const handleValidate = React.useCallback(() => {
    if (!formData.id.trim()) {
      toast.add({
        title: "Validation Error",
        description: "Inquiry ID/Code is required",
        type: "error",
      });
      return false;
    }
    if (!formData.targetModel.trim()) {
      toast.add({
        title: "Validation Error",
        description: "Target Model entity is required",
        type: "error",
      });
      return false;
    }
    if (formData.columns.length === 0) {
      toast.add({
        title: "Validation Error",
        description: "At least one column must be configured",
        type: "error",
      });
      return false;
    }
    return true;
  }, [formData]);

  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return;
    setSubmitting(true);
    try {
      const payload = cbs.inquiryConfig.save(formData);
      const res = await cbs.send(payload);
      if (res.status === "SUCCESS") {
        toast.add({
          title: "Inquiry Saved",
          description: `Configuration '${formData.id}' saved successfully`,
          type: "success",
        });
        if (tabId) setTabDirty(tabId, false);
      } else {
        toast.add({
          title: "Save Failed",
          description: res.message || "Failed to save inquiry configuration",
          type: "error",
        });
      }
    } catch (err: unknown) {
      toast.add({
        title: "Error",
        description: err instanceof Error ? err.message : "Error saving configuration",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, handleValidate, tabId, setTabDirty]);

  const handleCreateNew = React.useCallback(() => {
    const newId = `INQ.NEW_${Date.now().toString().slice(-4)}`;
    setFormData({
      ...INITIAL_INQUIRY_CONFIG,
      id: newId,
      title: "New Inquiry Layout",
      targetModel: "ACCOUNT",
      columns: [
        {
          id: "id",
          label: "ID",
          align: "left",
          format: "text",
          isMono: true,
          sortable: true,
          visible: true,
          isPinned: false,
        },
      ],
    });
    setRecordId(newId);
    setMode("I");
    toast.add({
      title: "New Inquiry Created",
      description: "Ready to configure new inquiry columns",
      type: "info",
    });
  }, [setFormData, setRecordId, setMode]);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
  }, [setMode]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    updateConfig,
    loading,
    submitting,
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    fetchRecord,
    handleValidate,
    handleSubmit,
    handleCreateNew,
    resetToIdle,
  };
}
