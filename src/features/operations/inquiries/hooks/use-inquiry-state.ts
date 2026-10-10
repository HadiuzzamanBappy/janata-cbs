"use client";

import * as React from "react";
import type { EnquiryRow, EnquirySchema, SelectionOperand } from "@/lib/data-schemas";
import { useWorkbenchStore } from "@/store";
import { filterDatasetByCriteria } from "../utils/filter-dataset";

export interface UseInquiryStateOptions {
  tabId?: string;
  schema: EnquirySchema | null;
}

export function useInquiryState({ tabId, schema }: UseInquiryStateOptions) {
  const { tabs, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Restore step from tab state or URL query params (for popups)
  const initialStep = React.useMemo(() => {
    if (currentTab?.enquiryState?.step) return currentTab.enquiryState.step;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("step") === "RESULTS") return "RESULTS";
    }
    return "SELECTION";
  }, [currentTab]);

  // 2. Restore criteria from tab state or URL query params
  const initialCriteria = React.useMemo((): Record<
    string,
    { value: string; operand: SelectionOperand }
  > => {
    if (
      currentTab?.enquiryState?.criteria &&
      Object.keys(currentTab.enquiryState.criteria).length > 0
    ) {
      return currentTab.enquiryState.criteria as Record<
        string,
        { value: string; operand: SelectionOperand }
      >;
    }
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("criteria");
      if (raw) {
        try {
          return JSON.parse(raw) as Record<string, { value: string; operand: SelectionOperand }>;
        } catch {
          // Safe parse fallback
        }
      }
    }
    return {};
  }, [currentTab]);

  // 3. Restore currentPage from tab state or URL query params
  const initialPage = React.useMemo(() => {
    if (currentTab?.enquiryState?.currentPage) return currentTab.enquiryState.currentPage;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const pg = Number(p.get("page"));
      if (pg > 0) return pg;
    }
    return 1;
  }, [currentTab]);

  // 4. Restore pageSize from tab state or URL query params
  const initialPageSize = React.useMemo(() => {
    if (currentTab?.enquiryState?.pageSize) return currentTab.enquiryState.pageSize;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const ps = Number(p.get("pageSize"));
      if (ps > 0) return ps;
    }
    return 10;
  }, [currentTab]);

  const [step, setStepState] = React.useState<"SELECTION" | "RESULTS">(initialStep);
  const [filteredRows, setFilteredRows] = React.useState<EnquiryRow[]>([]);
  const [currentPage, setCurrentPageState] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);
  const [currentCriteria, setCurrentCriteriaState] =
    React.useState<Record<string, { value: string; operand: SelectionOperand }>>(initialCriteria);

  const setStep = React.useCallback(
    (newStep: "SELECTION" | "RESULTS") => {
      setStepState(newStep);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            step: newStep,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  const setCurrentPage = React.useCallback(
    (page: number) => {
      setCurrentPageState(page);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            currentPage: page,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  const setPageSize = React.useCallback(
    (size: number) => {
      setPageSizeState(size);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            pageSize: size,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  const setCurrentCriteria = React.useCallback(
    (crit: Record<string, { value: string; operand: SelectionOperand }>) => {
      setCurrentCriteriaState(crit);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            criteria: crit,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  // Track initialization once when schema finishes loading
  const isInitializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!schema || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const hasPersisted = Object.keys(initialCriteria).length > 0;
    const initial: Record<string, { value: string; operand: SelectionOperand }> = hasPersisted
      ? initialCriteria
      : {};

    if (!hasPersisted) {
      for (const f of schema.selectionFields) {
        initial[f.id] = { value: f.value || "", operand: f.operand };
      }
    }

    setCurrentCriteriaState(initial);

    // If step was persisted as RESULTS, execute initial query or use sampleData
    if (initialStep === "RESULTS") {
      const result = filterDatasetByCriteria(schema.sampleData || [], initial);
      setFilteredRows(result);
    }

    setStepState(initialStep);
  }, [schema, initialStep, initialCriteria]);

  return {
    step,
    setStep,
    filteredRows,
    setFilteredRows,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentCriteria,
    setCurrentCriteria,
  };
}
