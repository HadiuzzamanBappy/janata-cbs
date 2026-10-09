"use client";

import * as React from "react";
import { useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/lib/cbs-screen";

export interface UseFormPersistenceOptions {
  tabId?: string;
  initialScreenMode?: CbsScreenMode;
  initialRecordId?: string;
  initialValues?: Record<string, unknown>;
}

export function useFormPersistence({
  tabId,
  initialScreenMode,
  initialRecordId: initialRecordIdProp,
  initialValues = {},
}: UseFormPersistenceOptions) {
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Initial screen mode
  const initialMode = React.useMemo<CbsScreenMode>(() => {
    if (initialScreenMode) return initialScreenMode;
    if (currentTab?.screenMode) return currentTab.screenMode;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const modeParam = p.get("mode") as CbsScreenMode | null;
      if (modeParam) {
        return modeParam;
      }
    }
    return "IDLE";
  }, [initialScreenMode, currentTab]);

  // 2. Initial record ID
  const initialRecordId = React.useMemo(() => {
    if (initialRecordIdProp) return initialRecordIdProp;
    if (currentTab?.searchRecordId) return currentTab.searchRecordId;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return p.get("recordId") || "";
    }
    return "";
  }, [initialRecordIdProp, currentTab]);

  const [screenMode, setScreenModeState] = React.useState<CbsScreenMode>(initialMode);
  const [searchRecordId, setSearchRecordIdState] = React.useState<string>(initialRecordId);

  const setScreenMode = React.useCallback(
    (mode: CbsScreenMode) => {
      setScreenModeState(mode);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { screenMode: mode });
      }
    },
    [tabId, updateTabState],
  );

  const setSearchRecordId = React.useCallback(
    (id: string) => {
      setSearchRecordIdState(id);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { searchRecordId: id });
      }
    },
    [tabId, updateTabState],
  );

  // 3. Form data from URL params (e.g. for popup drilldowns)
  const urlFormData = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("data");
      if (raw) {
        try {
          return JSON.parse(raw) as Record<string, unknown>;
        } catch {
          // Safe parse fallback
        }
      }
    }
    return {};
  }, []);

  const mergedInitialValues = React.useMemo(() => {
    return { ...initialValues, ...urlFormData, ...currentTab?.formData };
  }, [initialValues, urlFormData, currentTab?.formData]);

  const persistFieldChange = React.useCallback(
    (name: string, val: unknown) => {
      if (tabId) {
        updateFormData(tabId, { [name]: val });
        if (typeof updateTabState === "function") {
          updateTabState(tabId, { isDirty: true });
        }
      }
    },
    [tabId, updateFormData, updateTabState],
  );

  return {
    currentTab,
    screenMode,
    setScreenMode,
    searchRecordId,
    setSearchRecordId,
    mergedInitialValues,
    persistFieldChange,
  };
}
