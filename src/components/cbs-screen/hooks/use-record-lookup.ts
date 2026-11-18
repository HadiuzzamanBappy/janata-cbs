"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import type { RecordLookupItem } from "@/lib/cbs-screen";
import { logger } from "@/lib/core-logger";
import { unwrapRecordsPayload } from "@/lib/data-parsers";
import { isApiSuccess } from "@/lib/data-schemas";

/**
 * Universal hook for dynamic SBI record ID lookups and GNI sequence allocation.
 * Enforces Golden Rule 5: Zero client-side ID invention.
 *
 * @param controlName - The target CBS model/table (e.g. "USER.MGT", "ACCOUNT")
 * @param staticItems - Optional initial or predefined static items
 */
export function useRecordLookup(controlName?: string, staticItems?: RecordLookupItem[]) {
  const cleanControl = (controlName || "").split(",")[0].trim().toUpperCase();
  const [items, setItems] = React.useState<RecordLookupItem[]>(staticItems ?? []);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [generatingId, setGeneratingId] = React.useState<boolean>(false);
  const [hasFetched, setHasFetched] = React.useState<boolean>(false);
  const prevControlRef = React.useRef(cleanControl);

  // Reset when control/screen changes
  React.useEffect(() => {
    if (prevControlRef.current !== cleanControl) {
      prevControlRef.current = cleanControl;
      setItems(staticItems ?? []);
      setHasFetched(false);
      setLoading(false);
      setGeneratingId(false);
    }
  }, [cleanControl, staticItems]);

  /**
   * Action 2: Fetch record ID list from backend ('SBI').
   * The backend database handles indexing, prefix matching, and sorting.
   */
  const fetchRecordList = React.useCallback(
    async (query?: string) => {
      if (!cleanControl || loading) return;

      setLoading(true);

      try {
        const payload = cbs.model(cleanControl).searchIds({ recordId: query?.trim() });
        const res = await cbs.send<unknown>(payload, { silent: true });

        if (isApiSuccess(res) && res.data) {
          const raw = unwrapRecordsPayload<unknown>(res.data);
          const list =
            Array.isArray(raw) && raw.length > 0 ? raw : Array.isArray(res.data) ? res.data : [];

          const mapped: RecordLookupItem[] = list
            .map((item) =>
              typeof item === "string"
                ? item.trim()
                : typeof item === "object" && item
                  ? String(
                      (item as Record<string, unknown>).id ||
                        (item as Record<string, unknown>).recordId ||
                        "",
                    ).trim()
                  : "",
            )
            .filter(Boolean)
            .map((id) => ({ id }));

          setItems(mapped.length > 0 ? mapped : (staticItems ?? []));
        } else {
          setItems(staticItems ?? []);
        }
      } catch (err: unknown) {
        logger.warn(`Failed to fetch records for ${cleanControl}`, err, "RECORD_LOOKUP");
        setItems(staticItems ?? []);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    },
    [cleanControl, loading, staticItems],
  );

  /**
   * Action 3: Request new record ID sequence or user-defined draft from backend ('GNI').
   * Pure protocol: If no sequence can be allocated and no candidate ID given, returns empty string.
   */
  const fetchNewRecordId = React.useCallback(
    async (candidateId?: string): Promise<string> => {
      const cleanCandidate = (candidateId || "").trim().toUpperCase();
      if (!cleanControl) {
        return cleanCandidate || "";
      }

      setGeneratingId(true);
      try {
        const payload = cbs.model(cleanControl).getNewId({ recordId: cleanCandidate || undefined });
        const res = await cbs.send<{ recordId?: string; id?: string }>(payload, { silent: true });

        if (isApiSuccess(res) && res.data) {
          const allocatedId = String(res.data.recordId || res.data.id || "").trim();
          if (allocatedId) {
            return allocatedId;
          }
        }

        return cleanCandidate || "";
      } catch (err: unknown) {
        logger.warn(`GNI sequence request failed for ${cleanControl}`, err, "RECORD_LOOKUP");
        return cleanCandidate || "";
      } finally {
        setGeneratingId(false);
      }
    },
    [cleanControl],
  );

  return {
    items,
    loading,
    generatingId,
    hasFetched,
    fetchRecordList,
    fetchNewRecordId,
  };
}
