"use client";

import * as React from "react";
import type {
  UserGroupRecord,
  UserGroupScreenMode,
} from "@/lib/schemas/user-group-schema";
import { userGroupRecordSchema } from "@/lib/schemas/user-group-schema";
import { useWorkbenchStore } from "@/store";

export const INITIAL_USER_GROUP: UserGroupRecord = {
  recordId: "",
  groupLabel: "",
  menuIds: [],
  roleIds: [],
  isActive: true,
};

export function useUserGroupPersistence(initialId?: string, tabId?: string) {
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Dual-layer record ID resolution (URL params for popup, currentTab for F5)
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

  // 2. Dual-layer mode resolution
  const resolvedInitialMode = React.useMemo((): UserGroupScreenMode => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const urlMode = p.get("mode");
      if (urlMode === "CREATE" || urlMode === "EDIT" || urlMode === "VIEW" || urlMode === "IDLE") {
        return urlMode;
      }
    }
    if (currentTab?.screenMode) return currentTab.screenMode as UserGroupScreenMode;
    return resolvedInitialId ? "EDIT" : "IDLE";
  }, [currentTab?.screenMode, resolvedInitialId]);

  const [recordId, setRecordIdState] = React.useState<string>(resolvedInitialId);
  const [mode, setModeState] = React.useState<UserGroupScreenMode>(resolvedInitialMode);
  const [formData, setFormDataState] = React.useState<UserGroupRecord>(() => {
    if (currentTab?.formData && typeof currentTab.formData === "object") {
      const parseResult = userGroupRecordSchema.safeParse(currentTab.formData);
      if (parseResult.success) {
        return parseResult.data;
      }
    }
    return INITIAL_USER_GROUP;
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
    (nextMode: UserGroupScreenMode) => {
      setModeState(nextMode);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { screenMode: nextMode });
      }
    },
    [tabId, updateTabState],
  );

  const setFormData = React.useCallback<React.Dispatch<React.SetStateAction<UserGroupRecord>>>(
    (action) => {
      setFormDataState(action);
    },
    [],
  );

  // Decoupled sync to workbench tab store in commit effect
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
