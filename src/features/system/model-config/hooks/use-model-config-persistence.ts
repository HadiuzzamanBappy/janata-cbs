"use client";

import * as React from "react";
import type {
  ModelConfigRecord,
  ModelConfigScreenMode,
} from "@/lib/schemas/model-config-schema";
import { modelConfigRecordSchema } from "@/lib/schemas/model-config-schema";
import { useWorkbenchStore } from "@/store";

export const INITIAL_MODEL: ModelConfigRecord = {
  recordId: "",
  description: "",
  tableName: "",
  prefix: "",
  category: "",
  servicePath: "",
  userDefineId: false,
  predefineId: false,
  access: "",
  searchable: false,
  readOnly: false,
  authorize: false,
  associates: [],
  devBy: "",
  devDate: "",
  idDef: {
    idPrefix: "",
    idPattern: "",
    sequenceReset: false,
  },
  properties: [],
  isActive: false,
};

export function useModelConfigPersistence(initialId?: string, tabId?: string) {
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Resolve initial record ID from props, URL query params (detached popup), or workbench tab state
  const resolvedInitialId = React.useMemo(() => {
    if (initialId?.trim()) return initialId.trim().toUpperCase();
    if (currentTab?.searchRecordId) return currentTab.searchRecordId.toUpperCase();
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const urlId = p.get("recordId") || p.get("id");
      if (urlId?.trim()) return urlId.trim().toUpperCase();
    }
    return "";
  }, [initialId, currentTab?.searchRecordId]);

  // 2. Resolve initial mode from URL query params (detached popup) or workbench tab state
  const resolvedInitialMode = React.useMemo((): ModelConfigScreenMode => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const urlMode = p.get("mode");
      if (urlMode === "CREATE" || urlMode === "EDIT" || urlMode === "VIEW" || urlMode === "IDLE") {
        return urlMode;
      }
    }
    if (currentTab?.screenMode) return currentTab.screenMode;
    return resolvedInitialId ? "EDIT" : "IDLE";
  }, [currentTab?.screenMode, resolvedInitialId]);

  const [recordId, setRecordIdState] = React.useState<string>(resolvedInitialId);
  const [mode, setModeState] = React.useState<ModelConfigScreenMode>(resolvedInitialMode);
  const [formData, setFormDataState] = React.useState<ModelConfigRecord>(() => {
    if (currentTab?.formData && typeof currentTab.formData === "object") {
      const parseResult = modelConfigRecordSchema.safeParse(currentTab.formData);
      if (parseResult.success) {
        return parseResult.data;
      }
    }
    return INITIAL_MODEL;
  });

  const setRecordId = React.useCallback(
    (id: string) => {
      setRecordIdState(id);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { searchRecordId: id });
      }
    },
    [tabId, updateTabState],
  );

  const setMode = React.useCallback(
    (nextMode: ModelConfigScreenMode) => {
      setModeState(nextMode);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { screenMode: nextMode });
      }
    },
    [tabId, updateTabState],
  );

  const setFormData = React.useCallback<React.Dispatch<React.SetStateAction<ModelConfigRecord>>>(
    (action) => {
      setFormDataState(action);
    },
    [],
  );

  // Sync state changes to workbench tab store asynchronously outside the render phase
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (tabId) {
      updateFormData(tabId, formData as unknown as Record<string, unknown>);
      if (typeof updateTabState === "function") {
        updateTabState(tabId, { isDirty: true });
      }
    }
  }, [formData, tabId, updateFormData, updateTabState]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    resolvedInitialId,
    resolvedInitialMode,
  };
}
