"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/core-logger";
import {
  type FilterCriteriaMap,
  INQUIRY_MAX_ROWS,
  type InquiryConfigRecord,
  type InquiryResult,
} from "@/lib/data-schemas";
import { runInquiry } from "../run-inquiry";

/** A run's outcome; `aborted` means a newer run or an unmount superseded it (nothing was shown). */
export type InquiryRunOutcome =
  | { readonly status: "ok"; readonly result: InquiryResult }
  | { readonly status: "failed" | "aborted" };

export interface InquiryRunner {
  readonly run: (criteria: FilterCriteriaMap, curPage?: number) => Promise<InquiryRunOutcome>;
  readonly running: boolean;
}

const FAILED: InquiryRunOutcome = { status: "failed" };
const ABORTED: InquiryRunOutcome = { status: "aborted" };

/**
 * Runs a saved inquiry for one screen, one query at a time: a new run aborts the one in flight and
 * an unmount aborts the last, so a late response never replaces a newer one. Each run raises
 * exactly one toast (the matched count, saying so when the row cap trimmed the result, or the
 * failure); an abort is silent.
 */
export function useInquiryRunner(
  inquiryId: string,
  config: InquiryConfigRecord | null,
): InquiryRunner {
  const controllerRef = React.useRef<AbortController | null>(null);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => () => controllerRef.current?.abort(), []);

  const run = React.useCallback(
    async (criteria: FilterCriteriaMap, curPage = 1): Promise<InquiryRunOutcome> => {
      if (!config || !inquiryId) return FAILED;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setRunning(true);
      try {
        const result = await runInquiry(inquiryId, config, criteria, controller.signal, curPage);
        if (controller.signal.aborted) return ABORTED;
        const trimmed = result.total > INQUIRY_MAX_ROWS && result.rows.length >= INQUIRY_MAX_ROWS;
        toast.add({
          title: "Query Executed",
          description: trimmed
            ? `Showing the first ${result.rows.length} of ${result.total} matching records. Narrow the filters to see the rest.`
            : `Matched ${result.total} record(s)`,
          type: trimmed ? "warning" : "info",
        });
        return { status: "ok", result };
      } catch (err) {
        // An abort was superseded on purpose; UNAUTHORIZED is already handled by the transport
        if (controller.signal.aborted) return ABORTED;
        if (err instanceof Error && err.message === "UNAUTHORIZED") return FAILED;
        logger.warn("Inquiry query failed", err, "INQUIRY");
        toast.add({
          title: "Query Failed",
          description: err instanceof Error ? err.message : "Backend query failed",
          type: "destructive",
        });
        return FAILED;
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setRunning(false);
        }
      }
    },
    [inquiryId, config],
  );

  return { run, running };
}
