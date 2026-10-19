// ============================================================================
// Universal Dual-Layer Persistence Hook for CBS Screens & Workbench Tabs
//
// Implements the canonical persistence contract:
//  - hydrate(record): sets data AND baseline (isDirty: false)
//  - rebaseline(): sets baseline to current data
//  - isDirty: computed via computeDelta(baseline, formData)
//  - reset(): resets to IDLE, clears ID, restores initialData and clean baseline
//  - 400ms debounced synchronization to the WorkbenchStore
// ============================================================================

"use client";

import * as React from "react";
import { evaluateDirty } from "@/lib/cbs-record";
import type { CbsPersistenceOptions, CbsScreenMode } from "@/lib/cbs-screen";
import { useWorkbenchStore } from "@/store";

export interface UseCbsPersistenceReturn<TRecord> {
  recordId: string;
  setRecordId: (id: string) => void;
  mode: CbsScreenMode;
  setMode: (mode: CbsScreenMode) => void;
  formData: TRecord;
  setFormData: React.Dispatch<React.SetStateAction<TRecord>>;
  hydrate: (record: TRecord) => void;
  rebaseline: () => void;
  isDirty: boolean;
  dirtyKeys: string[];
  reset: () => void;
  resolvedInitialId: string;
  resolvedInitialMode: CbsScreenMode;
}

export function useCbsPersistence<TRecord>({
  initialId,
  tabId,
  initialData,
  schema,
  fallbackMode = "IDLE",
  ignoredKeys = [],
}: CbsPersistenceOptions<TRecord> & {
  ignoredKeys?: string[];
}): UseCbsPersistenceReturn<TRecord> {
  const { tabs, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Resolve initial record ID once on mount
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
    : (initialIdRef.current ?? "");

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

  // 3. Hydrate initial form data with schema validation fallback
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

  // 4. Baseline snapshot (restored from tab baseline if tab reloaded)
  const baselineRef = React.useRef<TRecord>(
    (currentTab?.baseline as unknown as TRecord) ??
      (currentTab?.formData ? (currentTab.formData as unknown as TRecord) : initialData),
  );

  // 5. Evaluate dirty state strictly via delta engine
  const delta = React.useMemo(() => {
    return evaluateDirty(
      baselineRef.current as Record<string, unknown>,
      formData as Record<string, unknown>,
      ignoredKeys,
    );
  }, [formData, ignoredKeys]);

  const isDirty = delta.isDirty;
  const dirtyKeys = delta.dirtyKeys as string[];

  // 6. Mutators
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

  const hydrate = React.useCallback(
    (record: TRecord) => {
      baselineRef.current = JSON.parse(JSON.stringify(record)) as TRecord;
      setFormDataState(record);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          formData: record as unknown as Record<string, unknown>,
          baseline: record as unknown as Record<string, unknown>,
          isDirty: false,
        });
      }
    },
    [tabId, updateTabState],
  );

  const rebaseline = React.useCallback(() => {
    baselineRef.current = JSON.parse(JSON.stringify(formData)) as TRecord;
    if (tabId && typeof updateTabState === "function") {
      updateTabState(tabId, {
        baseline: formData as unknown as Record<string, unknown>,
        isDirty: false,
      });
    }
  }, [formData, tabId, updateTabState]);

  const reset = React.useCallback(() => {
    setModeState("IDLE");
    setRecordIdState("");
    setFormDataState(initialData);
    baselineRef.current = JSON.parse(JSON.stringify(initialData)) as TRecord;
    if (tabId && typeof updateTabState === "function") {
      updateTabState(tabId, {
        searchRecordId: "",
        screenMode: "IDLE",
        formData: initialData as unknown as Record<string, unknown>,
        baseline: initialData as unknown as Record<string, unknown>,
        isDirty: false,
      });
    }
  }, [initialData, tabId, updateTabState]);

  // 7. Debounced (400ms) sync to tab store while typing
  const isHydratedOrReset = React.useRef(true);
  React.useEffect(() => {
    if (isHydratedOrReset.current) {
      isHydratedOrReset.current = false;
      return;
    }

    if (!tabId || typeof updateTabState !== "function") return;

    const timer = setTimeout(() => {
      updateTabState(tabId, {
        formData: formData as unknown as Record<string, unknown>,
        isDirty,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [formData, isDirty, tabId, updateTabState]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    hydrate,
    rebaseline,
    isDirty,
    dirtyKeys,
    reset,
    resolvedInitialId,
    resolvedInitialMode,
  };
}
