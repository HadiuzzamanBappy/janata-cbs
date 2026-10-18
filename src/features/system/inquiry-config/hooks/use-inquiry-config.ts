"use client";

import { STATIC_INQUIRY_CONFIG_LIST, STATIC_INQUIRY_CONFIGS } from "@fixtures";
import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type {
  InquiryActionConfig,
  InquiryColumnConfig,
  InquiryConfigRecord,
  InquiryFilterConfig,
} from "@/lib/data-schemas/inquiry-config-schema";
import { useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/types";
import {
  INITIAL_INQUIRY_CONFIG,
  useInquiryConfigPersistence,
} from "./use-inquiry-config-persistence";

export interface AvailableInquiryItem {
  id: string;
  label: string;
  details: string;
  record?: InquiryConfigRecord;
}

export function useInquiryConfig(initialId?: string, tabId?: string) {
  const setTabDirty = useWorkbenchStore((state) => state.setTabDirty);

  const { recordId, setRecordId, mode, setMode, formData, setFormData, updateConfig } =
    useInquiryConfigPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Available inquiries catalog for search and quick-select
  const availableInquiries: AvailableInquiryItem[] = React.useMemo(() => {
    const list = (STATIC_INQUIRY_CONFIG_LIST || []) as InquiryConfigRecord[];
    return list.map((record) => ({
      id: record.id,
      label: `${record.title} (${record.targetModel})`,
      details: `${record.columns.length} columns • ${record.targetModel}`,
      record,
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Column Management
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Selection / Filter Management
  // ---------------------------------------------------------------------------
  const addFilter = React.useCallback(
    (filter: InquiryFilterConfig) => {
      updateConfig({
        filters: [...(formData.filters || []), filter],
      });
    },
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
    (index: number) => {
      const nextFilters = (formData.filters || []).filter((_, i) => i !== index);
      updateConfig({ filters: nextFilters });
    },
    [formData.filters, updateConfig],
  );

  const reorderFilters = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const filters = formData.filters || [];
      if (fromIndex < 0 || fromIndex >= filters.length || toIndex < 0 || toIndex >= filters.length)
        return;
      const nextFilters = [...filters];
      const [moved] = nextFilters.splice(fromIndex, 1);
      nextFilters.splice(toIndex, 0, moved);
      updateConfig({ filters: nextFilters });
    },
    [formData.filters, updateConfig],
  );

  // ---------------------------------------------------------------------------
  // Row Action Buttons Management
  // ---------------------------------------------------------------------------
  const addAction = React.useCallback(
    (action: InquiryActionConfig) => {
      updateConfig({
        actions: [...(formData.actions || []), action],
      });
    },
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
    (index: number) => {
      const nextActions = (formData.actions || []).filter((_, i) => i !== index);
      updateConfig({ actions: nextActions });
    },
    [formData.actions, updateConfig],
  );

  const reorderActions = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const actions = formData.actions || [];
      if (fromIndex < 0 || fromIndex >= actions.length || toIndex < 0 || toIndex >= actions.length)
        return;
      const nextActions = [...actions];
      const [moved] = nextActions.splice(fromIndex, 1);
      nextActions.splice(toIndex, 0, moved);
      updateConfig({ actions: nextActions });
    },
    [formData.actions, updateConfig],
  );

  // ---------------------------------------------------------------------------
  // Data Fetching & Operations
  // ---------------------------------------------------------------------------
  const fetchRecord = React.useCallback(
    async (targetId: string, requestedMode: CbsScreenMode = "I") => {
      if (!targetId.trim()) return;
      setLoading(true);
      try {
        const payload = cbs.inquiryConfig.get(targetId);
        const res = await cbs.send<InquiryConfigRecord>(payload);
        if (res.status === "SUCCESS" && res.data) {
          const rec = res.data;
          setFormData({
            ...rec,
            actions: rec.actions || [],
            filters: rec.filters || [],
          });
          setRecordId(targetId);
          setMode(requestedMode);
          if (tabId) setTabDirty(tabId, false);
        } else {
          // Check static fixtures as fallback
          const cleanId = targetId.trim().toUpperCase();
          const staticMatch = (STATIC_INQUIRY_CONFIGS as Record<string, InquiryConfigRecord>)[
            cleanId
          ];
          if (staticMatch) {
            setFormData({
              ...staticMatch,
              actions: staticMatch.actions || [],
              filters: staticMatch.filters || [],
            });
            setRecordId(cleanId);
            setMode(requestedMode);
            if (tabId) setTabDirty(tabId, false);
          } else {
            toast.add({
              title: "Record Not Found",
              description: res.message || `No inquiry configuration for '${targetId}'`,
              type: "info",
            });
          }
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
    [setFormData, setRecordId, setMode, tabId, setTabDirty],
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
          id: "recordId",
          label: "ID / Ref",
          align: "left",
          format: "text",
          isMono: true,
          sortable: true,
          visible: true,
          isPinned: false,
        },
      ],
      filters: [],
      actions: [
        {
          id: "VIEW",
          label: "View",
          targetCommand: "ACCOUNT,SEE",
          actionType: "view",
          icon: "eye",
          openMode: "tab",
          idParamField: "recordId",
        },
      ],
    });
    setRecordId(newId);
    setMode("I");
    toast.add({
      title: "New Inquiry Created",
      description: "Ready to configure new inquiry criteria and table layout",
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
    availableInquiries,
    // Columns
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    // Filters
    addFilter,
    updateFilter,
    removeFilter,
    reorderFilters,
    // Actions
    addAction,
    updateAction,
    removeAction,
    reorderActions,
    // Operations
    fetchRecord,
    handleValidate,
    handleSubmit,
    handleCreateNew,
    resetToIdle,
  };
}
