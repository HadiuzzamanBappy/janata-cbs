"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { broadcastRecordMutation } from "@/lib/cbs-screen";
import type {
  InquiryActionConfig,
  InquiryColumnConfig,
  InquiryConfigRecord,
  InquiryFilterConfig,
} from "@/lib/data-schemas/inquiry-config-schema";
import type { CbsScreenMode } from "@/types";
import { useInquiryConfigPersistence } from "./use-inquiry-config-persistence";

export interface AvailableInquiryItem {
  id: string;
  label: string;
  details: string;
  record?: InquiryConfigRecord;
}

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
    resolvedInitialId,
    resolvedInitialMode,
  } = useInquiryConfigPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [availableInquiries, setAvailableInquiries] = React.useState<AvailableInquiryItem[]>([]);

  // 1. Fetch live inquiry configurations catalog
  const refreshInquiries = React.useCallback(async () => {
    try {
      const res = await cbs.send<InquiryConfigRecord[]>(cbs.inquiryConfig.list(), {
        silent: true,
      });
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        setAvailableInquiries(
          res.data.map((record) => {
            const inqId = String(record.id || record.recordId || "");
            const desc = String(record.description || record.title || inqId);
            const ctrl = String(record.controllerName || record.targetModel || "N/A");
            return {
              id: inqId,
              label: `${desc} (${ctrl})`,
              details: `${record.columns?.length || 0} columns • ${ctrl}`,
              record,
            };
          }),
        );
      }
    } catch {
      // Silent fail on background catalog sync
    }
  }, []);

  React.useEffect(() => {
    refreshInquiries();
  }, [refreshInquiries]);

  // 2. Column / Filter / Action State Modifiers
  const updateConfig = React.useCallback(
    (patch: Partial<InquiryConfigRecord>) => {
      setFormData((prev) => ({ ...prev, ...patch }));
    },
    [setFormData],
  );

  const addColumn = React.useCallback(
    (column: InquiryColumnConfig) => updateConfig({ columns: [...formData.columns, column] }),
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
    (index: number) => updateConfig({ columns: formData.columns.filter((_, i) => i !== index) }),
    [formData.columns, updateConfig],
  );

  const reorderColumns = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const nextCols = [...formData.columns];
      const [moved] = nextCols.splice(fromIndex, 1);
      nextCols.splice(toIndex, 0, moved);
      updateConfig({ columns: nextCols });
    },
    [formData.columns, updateConfig],
  );

  const addFilter = React.useCallback(
    (filter: InquiryFilterConfig) =>
      updateConfig({ filters: [...(formData.filters || []), filter] }),
    [formData.filters, updateConfig],
  );

  const updateFilter = React.useCallback(
    (index: number, patch: Partial<InquiryFilterConfig>) => {
      const nextFilters = [...(formData.filters || [])];
      if (nextFilters[index]) {
        nextFilters[index] = { ...nextFilters[index], ...patch };
        updateConfig({ filters: nextFilters });
      }
    },
    [formData.filters, updateConfig],
  );

  const removeFilter = React.useCallback(
    (index: number) =>
      updateConfig({ filters: (formData.filters || []).filter((_, i) => i !== index) }),
    [formData.filters, updateConfig],
  );

  const reorderFilters = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const nextFilters = [...(formData.filters || [])];
      const [moved] = nextFilters.splice(fromIndex, 1);
      nextFilters.splice(toIndex, 0, moved);
      updateConfig({ filters: nextFilters });
    },
    [formData.filters, updateConfig],
  );

  const addAction = React.useCallback(
    (action: InquiryActionConfig) =>
      updateConfig({ actions: [...(formData.actions || []), action] }),
    [formData.actions, updateConfig],
  );

  const updateAction = React.useCallback(
    (index: number, patch: Partial<InquiryActionConfig>) => {
      const nextActions = [...(formData.actions || [])];
      if (nextActions[index]) {
        nextActions[index] = { ...nextActions[index], ...patch };
        updateConfig({ actions: nextActions });
      }
    },
    [formData.actions, updateConfig],
  );

  const removeAction = React.useCallback(
    (index: number) =>
      updateConfig({ actions: (formData.actions || []).filter((_, i) => i !== index) }),
    [formData.actions, updateConfig],
  );

  const reorderActions = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const nextActions = [...(formData.actions || [])];
      const [moved] = nextActions.splice(fromIndex, 1);
      nextActions.splice(toIndex, 0, moved);
      updateConfig({ actions: nextActions });
    },
    [formData.actions, updateConfig],
  );

  // 3. Fetch Single Record from Core
  const fetchRecord = React.useCallback(
    async (targetId: string, requestedMode: CbsScreenMode = "I") => {
      const cleanId = targetId.trim().toUpperCase();
      if (!cleanId) return;
      setLoading(true);
      try {
        const res = await cbs.send<InquiryConfigRecord>(cbs.inquiryConfig.get(cleanId));
        if (res.status === "SUCCESS" && res.data) {
          const rec = res.data;
          hydrate({
            ...rec,
            id: cleanId,
            actions: rec.actions || [],
            filters: rec.filters || [],
            columns: rec.columns || [],
          });
          setRecordId(cleanId);
          setMode(requestedMode);
        } else {
          toast.add({
            title: "Inquiry Not Found",
            description: res.message || `No inquiry configuration for '${cleanId}'`,
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
    [hydrate, setRecordId, setMode],
  );

  React.useEffect(() => {
    if (resolvedInitialId) {
      fetchRecord(resolvedInitialId, resolvedInitialMode || "I");
    }
  }, [resolvedInitialId, resolvedInitialMode, fetchRecord]);

  // 4. Validate & Standard CBS Lifecycle Mutations
  const handleValidate = React.useCallback(() => {
    const cleanId = String(recordId || formData.id || "")
      .trim()
      .toUpperCase();
    if (!cleanId) {
      toast.add({
        title: "Validation Error",
        description: "Inquiry ID is required",
        type: "error",
      });
      return false;
    }
    const target = String(formData.controllerName || formData.targetModel || "").trim();
    if (!target) {
      toast.add({
        title: "Validation Error",
        description: "Controller Name is required",
        type: "error",
      });
      return false;
    }
    return true;
  }, [formData.id, formData.targetModel, formData.controllerName, recordId]);

  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return;
    const cleanId = String(recordId || formData.id || "")
      .trim()
      .toUpperCase();
    setSubmitting(true);
    try {
      const res = await cbs.send<InquiryConfigRecord>(
        cbs.inquiryConfig.save({ ...formData, id: cleanId }),
      );
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("INQUIRY.CONFIG", cleanId);
        refreshInquiries();
        toast.add({
          title: "Inquiry Saved",
          description: `Configuration '${cleanId}' saved successfully`,
          type: "success",
        });
      } else {
        toast.add({
          title: "Save Failed",
          description: res.message || "Failed to save configuration",
          type: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, handleValidate, rebaseline, refreshInquiries, recordId]);

  const handleAuthorize = React.useCallback(async () => {
    const cleanId = String(recordId || formData.id || "")
      .trim()
      .toUpperCase();
    if (!cleanId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send<InquiryConfigRecord>(cbs.inquiryConfig.authorize(cleanId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("INQUIRY.CONFIG", cleanId);
        refreshInquiries();
        toast.add({
          title: "Inquiry Authorized",
          description: `Configuration '${cleanId}' approved`,
          type: "success",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData.id, recordId, rebaseline, refreshInquiries]);

  const handleHold = React.useCallback(async () => {
    const cleanId = String(recordId || formData.id || "")
      .trim()
      .toUpperCase();
    if (!cleanId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send(cbs.inquiryConfig.hold(cleanId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("INQUIRY.CONFIG", cleanId);
        refreshInquiries();
        toast.add({
          title: "Inquiry Held",
          description: `Configuration '${cleanId}' placed on hold`,
          type: "default",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData.id, recordId, rebaseline, refreshInquiries]);

  const handleDelete = React.useCallback(async () => {
    const cleanId = String(recordId || formData.id || "")
      .trim()
      .toUpperCase();
    if (!cleanId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send(cbs.inquiryConfig.delete(cleanId));
      if (res.status === "SUCCESS") {
        broadcastRecordMutation("INQUIRY.CONFIG", cleanId);
        refreshInquiries();
        reset();
        toast.add({
          title: "Inquiry Deleted",
          description: `Configuration '${cleanId}' deleted`,
          type: "default",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData.id, recordId, reset, refreshInquiries]);

  const handleReverse = React.useCallback(async () => {
    const cleanId = String(recordId || formData.id || "")
      .trim()
      .toUpperCase();
    if (!cleanId) return;
    setSubmitting(true);
    try {
      const res = await cbs.send(cbs.inquiryConfig.reverse(cleanId));
      if (res.status === "SUCCESS") {
        rebaseline();
        broadcastRecordMutation("INQUIRY.CONFIG", cleanId);
        refreshInquiries();
        toast.add({
          title: "Inquiry Reversed",
          description: `Configuration '${cleanId}' reversed`,
          type: "default",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData.id, recordId, rebaseline, refreshInquiries]);

  const resetToIdle = React.useCallback(() => {
    reset();
    setMode("IDLE");
  }, [reset, setMode]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    isDirty,
    loading,
    submitting,
    availableInquiries,
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    addFilter,
    updateFilter,
    removeFilter,
    reorderFilters,
    addAction,
    updateAction,
    removeAction,
    reorderActions,
    fetchRecord,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
    resetToIdle,
  };
}
