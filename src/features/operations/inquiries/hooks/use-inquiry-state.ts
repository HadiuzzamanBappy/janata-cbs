"use client";

import * as React from "react";
import { buildDefaultCriteria } from "@/lib/cbs-inquiry-spec";
import type { FilterCriteriaMap, InquiryConfigRecord, InquiryRow } from "@/lib/data-schemas";
import { useWorkbenchStore } from "@/store";
import { CBS_INQUIRY_STEP, type CbsInquiryStep } from "@/types";

export interface UseInquiryStateOptions {
  tabId?: string;
  schema: InquiryConfigRecord | null;
}

export function useInquiryState({ tabId, schema }: UseInquiryStateOptions) {
  const { tabs, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // 1. Initial Step: Persisted tab state or CBS_INQUIRY_STEP.SELECTION
  const initialStep = currentTab?.inquiryState?.step || CBS_INQUIRY_STEP.SELECTION;

  // 2. Initial Criteria: Persisted tab criteria or default from schema
  const initialCriteria = React.useMemo((): FilterCriteriaMap => {
    if (
      currentTab?.inquiryState?.criteria &&
      Object.keys(currentTab.inquiryState.criteria).length > 0
    ) {
      return currentTab.inquiryState.criteria;
    }
    return buildDefaultCriteria(schema?.INQSelectField);
  }, [currentTab?.inquiryState?.criteria, schema?.INQSelectField]);

  // 3. Initial Current Page: Persisted tab page or 1
  const initialPage = currentTab?.inquiryState?.currentPage || 1;

  // 4. Initial Page Size: Persisted tab size or schema perpageItem or 30
  const initialPageSize = React.useMemo(() => {
    if (currentTab?.inquiryState?.pageSize) return currentTab.inquiryState.pageSize;
    const schemaPerPage = Number(schema?.INQInfo?.perpageItem);
    if (!Number.isNaN(schemaPerPage) && schemaPerPage > 0) {
      return schemaPerPage;
    }
    return 30;
  }, [currentTab?.inquiryState?.pageSize, schema?.INQInfo?.perpageItem]);

  const [step, setStepState] = React.useState<CbsInquiryStep>(initialStep);
  const [filteredRows, setFilteredRows] = React.useState<InquiryRow[]>([]);
  const [currentPage, setCurrentPageState] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);
  const [currentCriteria, setCurrentCriteriaState] =
    React.useState<FilterCriteriaMap>(initialCriteria);

  const setStep = React.useCallback(
    (newStep: CbsInquiryStep) => {
      setStepState(newStep);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          inquiryState: {
            ...currentTab?.inquiryState,
            step: newStep,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.inquiryState],
  );

  const setCurrentPage = React.useCallback(
    (page: number) => {
      setCurrentPageState(page);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          inquiryState: {
            ...currentTab?.inquiryState,
            currentPage: page,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.inquiryState],
  );

  const setPageSize = React.useCallback(
    (size: number) => {
      setPageSizeState(size);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          inquiryState: {
            ...currentTab?.inquiryState,
            pageSize: size,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.inquiryState],
  );

  const setCurrentCriteria = React.useCallback(
    (crit: FilterCriteriaMap) => {
      setCurrentCriteriaState(crit);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          inquiryState: {
            ...currentTab?.inquiryState,
            criteria: crit,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.inquiryState],
  );

  // Sync criteria when schema loads if not already configured in tab
  const isInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (!schema || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const hasPersistedCriteria =
      currentTab?.inquiryState?.criteria &&
      Object.keys(currentTab.inquiryState.criteria).length > 0;

    if (!hasPersistedCriteria) {
      const defaults = buildDefaultCriteria(schema.INQSelectField);
      setCurrentCriteriaState(defaults);
    }
  }, [schema, currentTab?.inquiryState?.criteria]);

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
