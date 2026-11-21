"use client";

import * as React from "react";
import { buildDefaultCriteria } from "@/lib/cbs-inquiry-spec";
import type { FilterCriteriaMap, InquiryConfigRecord, InquiryTabState } from "@/lib/data-schemas";
import { useWorkbenchStore } from "@/store";
import { CBS_INQUIRY_STEP, type CbsInquiryStep } from "@/types";

export interface UseInquiryStateOptions {
  tabId?: string;
  schema: InquiryConfigRecord;
}

/**
 * The inquiry screen's step, criteria and page, persisted on the workbench tab so a refresh, a
 * popup or a dock-back restores them. The tab's saved state is read once, at mount (the schema is
 * loaded by then); each change is merged into the store's current value, so changes made in the
 * same tick never overwrite each other.
 */
export function useInquiryState({ tabId, schema }: UseInquiryStateOptions) {
  const saved = useWorkbenchStore((s) =>
    tabId ? s.tabs.find((t) => t.id === tabId)?.inquiryState : undefined,
  );
  const updateInquiryState = useWorkbenchStore((s) => s.updateInquiryState);

  const [step, setStepState] = React.useState<CbsInquiryStep>(
    () => saved?.step ?? CBS_INQUIRY_STEP.SELECTION,
  );
  const [criteria, setCriteriaState] = React.useState<FilterCriteriaMap>(() =>
    saved?.criteria && Object.keys(saved.criteria).length > 0
      ? saved.criteria
      : buildDefaultCriteria(schema.INQSelectField),
  );
  const [page, setPageState] = React.useState(() => saved?.currentPage ?? 1);

  const persist = React.useCallback(
    (patch: InquiryTabState) => {
      if (tabId) updateInquiryState(tabId, patch);
    },
    [tabId, updateInquiryState],
  );

  const setStep = React.useCallback(
    (next: CbsInquiryStep) => {
      setStepState(next);
      persist({ step: next });
    },
    [persist],
  );

  const setCriteria = React.useCallback(
    (next: FilterCriteriaMap) => {
      setCriteriaState(next);
      persist({ criteria: next });
    },
    [persist],
  );

  const setPage = React.useCallback(
    (next: number) => {
      setPageState(next);
      persist({ currentPage: next });
    },
    [persist],
  );

  return { step, setStep, criteria, setCriteria, page, setPage };
}
