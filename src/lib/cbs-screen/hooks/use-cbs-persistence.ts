"use client";

import * as React from "react";
import { useWorkbenchStore } from "@/store";
import type { CbsPersistenceOptions, CbsScreenMode } from "../types";

/**
 * Universal dual-layer persistence hook for all CBS screens and workbench tabs.
 * Supports:
 *  1. Props (initialId)
 *  2. URL Query parameters (detached popup / deep link)
 *  3. Zustand workbench tabs state (tab switching & dirty tracking)
 */
export function useCbsPersistence<TRecord>({
  initialId,
  tabId,
  initialData,
  schema,
  fallbackMode = "IDLE",
}: CbsPersistenceOptions<TRecord>) {
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Resolve initial record ID once on mount / explicit initialId prop change
  const initialIdRef = React.useRef<string | null>(null);
  if (initialIdRef.current === null) {
    if (initialId?.trim()) {
      initialIdRef.current = initialId.trim().toUpperCase();
    } else if (currentTab?.searchRecordId) {
      initialIdRef.current = currentTab.searchRecordId.toUpperCase();
    } else if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const urlId = p.get("recordId") || p.get("id");
      initialIdRef.current = urlId?.trim() ? urlId.trim().toUpperCase() : "";
    } else {
      initialIdRef.current = "";
    }
  }

  const resolvedInitialId = initialId?.trim()
    ? initialId.trim().toUpperCase()
    : initialIdRef.current;

  // 2. Resolve initial screen mode once on mount
  const initialModeRef = React.useRef<CbsScreenMode | null>(null);
  if (initialModeRef.current === null) {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const urlMode = p.get("mode") as CbsScreenMode | null;
      if (
        urlMode === "IDLE" ||
        urlMode === "S" ||
        urlMode === "I" ||
        urlMode === "D" ||
        urlMode === "A" ||
        urlMode === "R" ||
        urlMode === "H"
      ) {
        initialModeRef.current = urlMode;
      }
    }
    if (!initialModeRef.current) {
      if (currentTab?.screenMode) {
        initialModeRef.current = currentTab.screenMode as CbsScreenMode;
      } else {
        initialModeRef.current = resolvedInitialId ? "I" : fallbackMode;
      }
    }
  }

  const resolvedInitialMode = initialModeRef.current || fallbackMode;

  const [recordId, setRecordIdState] = React.useState<string>(resolvedInitialId);
  const [mode, setModeState] = React.useState<CbsScreenMode>(resolvedInitialMode);

  // 3. Hydrate form data with schema validation fallback
  const [formData, setFormDataState] = React.useState<TRecord>(() => {
    if (currentTab?.formData && typeof currentTab.formData === "object") {
      if (schema) {
        const parseResult = schema.safeParse(currentTab.formData);
        if (parseResult.success) {
          return parseResult.data;
        }
      } else {
        return currentTab.formData as unknown as TRecord;
      }
    }
    return initialData;
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
    (nextMode: CbsScreenMode) => {
      setModeState(nextMode);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { screenMode: nextMode });
      }
    },
    [tabId, updateTabState],
  );

  const setFormData = React.useCallback<React.Dispatch<React.SetStateAction<TRecord>>>((action) => {
    setFormDataState(action);
  }, []);

  // Decoupled sync to workbench tab store
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
