"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { unwrapRecordsPayload } from "@/lib/data-parsers";

export interface RecordLookupItem {
  id: string;
  label?: string;
  details?: string;
}

/**
 * Universal hook for dynamic SBI record ID lookups and GNI sequence allocation.
 *
 * @param controlName - The target CBS model/table (e.g. "USER.MGT", "ACCOUNT")
 * @param staticItems - Optional initial or predefined static items
 */
export function useRecordLookup(controlName?: string, staticItems?: RecordLookupItem[]) {
  const cleanControl = (controlName || "").split(",")[0].trim().toUpperCase();
  const [items, setItems] = React.useState<RecordLookupItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [generatingId, setGeneratingId] = React.useState<boolean>(false);
  const [hasFetched, setHasFetched] = React.useState<boolean>(false);
  const prevControlRef = React.useRef(cleanControl);

  // Reset when control/screen changes
  React.useEffect(() => {
    if (prevControlRef.current !== cleanControl) {
      prevControlRef.current = cleanControl;
      setItems([]);
      setHasFetched(false);
      setLoading(false);
      setGeneratingId(false);
    }
  }, [cleanControl]);

  /**
   * Action 2: Fetch sorted record ID list ('SBI') with optional client-side prefix filter.
   */
  const fetchRecordList = React.useCallback(
    async (query?: string) => {
      if (!cleanControl || loading) return;

      const cleanQuery = (query || "").trim().toLowerCase();
      setLoading(true);

      try {
        // SBI returns the full ID list; the query prefix is applied client-side below.
        const payload = cbs.form.searchRecordIds(cleanControl);
        const res = await cbs.send<unknown>(payload, { silent: true });

        const mappedItems: RecordLookupItem[] = [];

        if (res.status === "SUCCESS" && res.data) {
          const rawRecords = unwrapRecordsPayload<Record<string, unknown>>(res.data);

          if (Array.isArray(rawRecords) && rawRecords.length > 0) {
            for (const item of rawRecords) {
              const id = String(item.id || item.recordId || item.code || item.userId || "").trim();
              if (!id) continue;

              const label = String(
                item.label ||
                  item.description ||
                  item.employeeName ||
                  item.name ||
                  item.accountTitle1 ||
                  item["ACCOUNT.TITLE"] ||
                  id,
              );

              const details = item.details
                ? String(item.details)
                : item.branchCode
                  ? `Branch: ${item.branchCode}`
                  : undefined;

              mappedItems.push({ id, label, details });
            }
          } else if (Array.isArray(res.data)) {
            for (const item of res.data) {
              if (typeof item === "string") {
                mappedItems.push({ id: item });
              } else if (item && typeof item === "object") {
                const rec = item as Record<string, unknown>;
                const id = String(rec.id || rec.recordId || rec.userId || "").trim();
                if (id) {
                  mappedItems.push({
                    id,
                    label: String(rec.label || rec.employeeName || rec.description || id),
                    details: rec.details ? String(rec.details) : undefined,
                  });
                }
              }
            }
          }
        }

        // Merge with static fallback items if backend returned none
        const candidateItems =
          mappedItems.length > 0
            ? mappedItems
            : staticItems && staticItems.length > 0
              ? staticItems
              : [];

        // Filter by query if client query specified
        const filteredItems = cleanQuery
          ? candidateItems.filter(
              (item) =>
                item.id.toLowerCase().includes(cleanQuery) ||
                item.label?.toLowerCase().includes(cleanQuery) ||
                item.details?.toLowerCase().includes(cleanQuery),
            )
          : candidateItems;

        // Sort naturally by ID (numeric-aware ascending)
        const sortedItems = [...filteredItems].sort((a, b) =>
          a.id.localeCompare(b.id, undefined, { numeric: true }),
        );

        setItems(sortedItems);
      } catch (err: unknown) {
        console.warn(`[useRecordLookup] Failed to fetch records for ${cleanControl}:`, err);
        const fallback = staticItems || [];
        const filtered = cleanQuery
          ? fallback.filter(
              (item) =>
                item.id.toLowerCase().includes(cleanQuery) ||
                item.label?.toLowerCase().includes(cleanQuery),
            )
          : fallback;
        setItems(
          [...filtered].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
        );
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    },
    [cleanControl, loading, staticItems],
  );

  /**
   * Action 3: Request new record ID sequence from backend ('GNI').
   */
  const fetchNewRecordId = React.useCallback(async (): Promise<string> => {
    if (!cleanControl) {
      return `NEW.${Date.now().toString().slice(-4)}`;
    }

    setGeneratingId(true);
    try {
      const payload = cbs.form.getNewRecordId(cleanControl);
      const res = await cbs.send<{ recordId?: string; id?: string }>(payload, { silent: true });

      if (res.status === "SUCCESS" && res.data) {
        const allocatedId = String(res.data.recordId || res.data.id || "").trim();
        if (allocatedId) {
          return allocatedId;
        }
      }
    } catch (err: unknown) {
      console.warn(`[useRecordLookup] GNI sequence request failed for ${cleanControl}:`, err);
    } finally {
      setGeneratingId(false);
    }

    // Graceful offline fallback
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    return `${cleanControl}.${randomSuffix}`;
  }, [cleanControl]);

  return {
    items,
    loading,
    generatingId,
    hasFetched,
    fetchRecordList,
    fetchNewRecordId,
  };
}
