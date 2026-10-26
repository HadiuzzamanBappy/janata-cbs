"use client";

import * as React from "react";
import { useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/types";

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
  const initialMode = initialScreenMode || currentTab?.screenMode || "IDLE";

  // 2. Initial record ID
  const initialRecordId = initialRecordIdProp || currentTab?.searchRecordId || "";

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

  // 3. Merged Initial Values (fixture/prop defaults + saved draft values in tab)
  const mergedInitialValues = React.useMemo(() => {
    return { ...initialValues, ...currentTab?.formData };
  }, [initialValues, currentTab?.formData]);

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
