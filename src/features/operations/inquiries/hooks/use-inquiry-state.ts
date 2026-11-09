"use client";

import * as React from "react";
import { buildDefaultCriteria, type FilterCriteriaMap } from "@/features/inquiry-engine";
import type { EnquiryRow, InquiryConfigRecord } from "@/lib/data-schemas";
import { useWorkbenchStore } from "@/store";

export interface UseInquiryStateOptions {
  tabId?: string;
  schema: InquiryConfigRecord | null;
}

export function useInquiryState({ tabId, schema }: UseInquiryStateOptions) {
  const { tabs, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Initial Step: Persisted tab state or "SELECTION"
  const initialStep = currentTab?.enquiryState?.step || "SELECTION";

  // 2. Initial Criteria: Persisted tab criteria or default from schema
  const initialCriteria = React.useMemo((): FilterCriteriaMap => {
    if (
      currentTab?.enquiryState?.criteria &&
      Object.keys(currentTab.enquiryState.criteria).length > 0
    ) {
      return currentTab.enquiryState.criteria as unknown as FilterCriteriaMap;
    }
    return buildDefaultCriteria(schema?.INQSelectField);
  }, [currentTab?.enquiryState?.criteria, schema?.INQSelectField]);

  // 3. Initial Current Page: Persisted tab page or 1
  const initialPage = currentTab?.enquiryState?.currentPage || 1;

  // 4. Initial Page Size: Persisted tab size or schema perpageItem or 30
  const initialPageSize = React.useMemo(() => {
    if (currentTab?.enquiryState?.pageSize) return currentTab.enquiryState.pageSize;
    const schemaPerPage = Number(schema?.INQInfo?.perpageItem);
    if (!Number.isNaN(schemaPerPage) && schemaPerPage > 0) {
      return schemaPerPage;
    }
    return 30;
  }, [currentTab?.enquiryState?.pageSize, schema?.INQInfo?.perpageItem]);

  const [step, setStepState] = React.useState<"SELECTION" | "RESULTS">(initialStep);
  const [filteredRows, setFilteredRows] = React.useState<EnquiryRow[]>([]);
  const [currentPage, setCurrentPageState] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);
  const [currentCriteria, setCurrentCriteriaState] =
    React.useState<FilterCriteriaMap>(initialCriteria);

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
    (crit: FilterCriteriaMap) => {
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

  // Sync criteria when schema loads if not already configured in tab
  const isInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (!schema || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const hasPersistedCriteria =
      currentTab?.enquiryState?.criteria &&
      Object.keys(currentTab.enquiryState.criteria).length > 0;

    if (!hasPersistedCriteria) {
      const defaults = buildDefaultCriteria(schema.INQSelectField);
      setCurrentCriteriaState(defaults);
    }
  }, [schema, currentTab?.enquiryState?.criteria]);

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
