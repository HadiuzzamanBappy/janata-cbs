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
 * Universal hook for dynamic GRL record lookups with caching & static fallback.
 *
 * @param controlName - The target CBS model/table (e.g. "USER.MGT", "ACCOUNT")
 * @param staticItems - Optional initial or predefined static items
 */
export function useRecordLookup(controlName?: string, staticItems?: RecordLookupItem[]) {
  const cleanControl = (controlName || "").split(",")[0].trim().toUpperCase();
  const [items, setItems] = React.useState<RecordLookupItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [hasFetched, setHasFetched] = React.useState<boolean>(false);
  const prevControlRef = React.useRef(cleanControl);

  // Reset when control/screen changes
  React.useEffect(() => {
    if (prevControlRef.current !== cleanControl) {
      prevControlRef.current = cleanControl;
      setItems([]);
      setHasFetched(false);
      setLoading(false);
    }
  }, [cleanControl]);

  const fetchRecordList = React.useCallback(async () => {
    if (!cleanControl || loading || hasFetched) return;

    setLoading(true);
    try {
      const payload = cbs.form.listRecords(cleanControl);
      const res = await cbs.send<unknown>(payload, { silent: true });

      if (res.status === "SUCCESS" && res.data) {
        const rawRecords = unwrapRecordsPayload<Record<string, unknown>>(res.data);
        const mappedItems: RecordLookupItem[] = [];

        // If unwrap returned objects
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
          // Direct array of items or strings
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

        if (mappedItems.length > 0) {
          setItems(mappedItems);
        } else if (staticItems && staticItems.length > 0) {
          setItems(staticItems);
        }
      } else if (staticItems && staticItems.length > 0) {
        setItems(staticItems);
      }
    } catch (err: unknown) {
      console.warn(`[useRecordLookup] Failed to fetch records for ${cleanControl}:`, err);
      if (staticItems && staticItems.length > 0) {
        setItems(staticItems);
      }
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [cleanControl, loading, hasFetched, staticItems]);

  return {
    items,
    loading,
    hasFetched,
    fetchRecordList,
  };
}
