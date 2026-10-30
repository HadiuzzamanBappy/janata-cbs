/**
 * Universal Dual-Layer Persistence Hook for CBS Screens & Workbench Tabs.
 * Manages form state, baseline snapshots, dirty tracking via delta engine, and 400ms tab sync.
 */
"use client";

import * as React from "react";
import { evaluateDirty } from "@/lib/cbs-record";
import type { CbsPersistenceOptions } from "@/lib/cbs-screen";
import {
  resolveInitialFormData,
  resolveInitialRecordId,
  resolveInitialScreenMode,
} from "@/lib/cbs-screen";
import { useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/types";

export interface UseCbsPersistenceReturn<TRecord> {
  // Identity & Mode
  recordId: string;
  setRecordId: (id: string) => void;
  mode: CbsScreenMode;
  setMode: (mode: CbsScreenMode) => void;

  // Form State & Mutators
  formData: TRecord;
  setFormData: React.Dispatch<React.SetStateAction<TRecord>>;
  hydrate: (record: TRecord) => void;
  rebaseline: () => void;
  reset: () => void;

  // Baseline Snapshot
  baseline: TRecord;

  // Delta Engine Dirty State
  isDirty: boolean;
  dirtyKeys: string[];

  // Mount Conditions
  resolvedInitialId: string;
  resolvedInitialMode: CbsScreenMode;
}

export function useCbsPersistence<TRecord extends Record<string, unknown>>({
  initialId,
  tabId,
  initialData,
  schema,
  fallbackMode = "IDLE",
  ignoredKeys = [],
}: CbsPersistenceOptions<TRecord>): UseCbsPersistenceReturn<TRecord> {
  const { tabs, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // ---------------------------------------------------------------------------
  // 1. Initial State Resolution (Mount-time resolution)
  // ---------------------------------------------------------------------------
  const initialIdRef = React.useRef<string | null>(null);
  if (initialIdRef.current === null) {
    initialIdRef.current = resolveInitialRecordId(initialId, currentTab?.searchRecordId);
  }
  const resolvedInitialId = initialIdRef.current;

  const initialModeRef = React.useRef<CbsScreenMode | null>(null);
  if (initialModeRef.current === null) {
    initialModeRef.current = resolveInitialScreenMode(
      currentTab?.screenMode,
      resolvedInitialId,
      fallbackMode,
    );
  }
  const resolvedInitialMode = initialModeRef.current;

  // ---------------------------------------------------------------------------
  // 2. Active Screen State & Baseline Snapshot
  // ---------------------------------------------------------------------------
  const [recordId, setRecordIdState] = React.useState<string>(resolvedInitialId);
  const [mode, setModeState] = React.useState<CbsScreenMode>(resolvedInitialMode);

  // Tier 1: Fast local state for instant keystroke response
  const [formData, setFormData] = React.useState<TRecord>(() =>
    resolveInitialFormData(currentTab?.formData, schema, initialData),
  );

  // Baseline snapshot for deterministic dirty comparison
  const baselineRef = React.useRef<TRecord>(
    (currentTab?.baseline as TRecord) ?? (currentTab?.formData as TRecord) ?? initialData,
  );

  // ---------------------------------------------------------------------------
  // 3. Dirty Evaluation (Delta Engine)
  // ---------------------------------------------------------------------------
  const delta = React.useMemo(() => {
    return evaluateDirty(baselineRef.current, formData, ignoredKeys as string[]);
  }, [formData, ignoredKeys]);

  const isDirty = delta.isDirty;
  const dirtyKeys = delta.dirtyKeys as string[];

  // ---------------------------------------------------------------------------
  // 4. Tab State Synchronizers
  // ---------------------------------------------------------------------------
  const setRecordId = React.useCallback(
    (id: string) => {
      setRecordIdState(id);
      if (tabId) updateTabState(tabId, { searchRecordId: id });
    },
    [tabId, updateTabState],
  );

  const setMode = React.useCallback(
    (nextMode: CbsScreenMode) => {
      setModeState(nextMode);
      if (tabId) updateTabState(tabId, { screenMode: nextMode });
    },
    [tabId, updateTabState],
  );

  // ---------------------------------------------------------------------------
  // 5. Canonical CBS Lifecycle Mutators
  // ---------------------------------------------------------------------------
  const hydrate = React.useCallback(
    (record: TRecord) => {
      baselineRef.current = structuredClone(record);
      setFormData(record);
      if (tabId) {
        updateTabState(tabId, {
          formData: record,
          baseline: record,
          isDirty: false,
        });
      }
    },
    [tabId, updateTabState],
  );

  const rebaseline = React.useCallback(() => {
    baselineRef.current = structuredClone(formData);
    if (tabId) {
      updateTabState(tabId, {
        baseline: formData,
        isDirty: false,
      });
    }
  }, [formData, tabId, updateTabState]);

  const reset = React.useCallback(() => {
    setModeState("IDLE");
    setRecordIdState("");
    setFormData(initialData);
    baselineRef.current = structuredClone(initialData);
    if (tabId) {
      updateTabState(tabId, {
        searchRecordId: "",
        screenMode: "IDLE",
        formData: initialData,
        baseline: initialData,
        isDirty: false,
      });
    }
  }, [initialData, tabId, updateTabState]);

  // ---------------------------------------------------------------------------
  // 6. Tier 2: Debounced (400ms) Global Tab Store Sync (Pillar 5)
  // ---------------------------------------------------------------------------
  const isHydratedOrReset = React.useRef(true);
  React.useEffect(() => {
    if (isHydratedOrReset.current) {
      isHydratedOrReset.current = false;
      return;
    }

    if (!tabId) return;

    const timer = setTimeout(() => {
      updateTabState(tabId, { formData, isDirty });
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
    reset,
    baseline: baselineRef.current,
    isDirty,
    dirtyKeys,
    resolvedInitialId,
    resolvedInitialMode,
  };
}
