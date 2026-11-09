"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

export interface AvailableInquiryItem {
  id: string;
  label: string;
  details: string;
  record?: InquiryConfigRecord;
}

export function useIcCatalog() {
  const queryClient = useQueryClient();

  const {
    data: inquiriesPool = [],
    isLoading: loadingCatalog,
    refetch,
  } = useQuery<AvailableInquiryItem[]>({
    queryKey: ["cbs", "inquiry-config", "catalog"],
    queryFn: async () => {
      const res = await cbs.send<Record<string, InquiryConfigRecord> | InquiryConfigRecord[]>(
        cbs.inquiryConfig.list(),
        { silent: true },
      );

      if (res.status === "SUCCESS" && res.data) {
        const rawList: Array<[string, InquiryConfigRecord]> = Array.isArray(res.data)
          ? res.data.map((item) => {
              const rec = item as InquiryConfigRecord & { id?: string; recordId?: string };
              const id = rec.id || rec.recordId || rec.INQInfo?.controllerName || "UNKNOWN";
              return [id, item];
            })
          : Object.entries(res.data);

        const seen = new Set<string>();
        const uniqueItems: AvailableInquiryItem[] = [];

        for (const [key, record] of rawList) {
          if (!key || seen.has(key)) continue;
          seen.add(key);

          const desc = record.INQInfo?.description || key;
          const ctrl = record.INQInfo?.controllerName || "N/A";
          const colCount = record.INQDef?.length || 0;

          uniqueItems.push({
            id: key,
            label: `${desc} (${ctrl})`,
            details: `${colCount} columns • ${ctrl}`,
            record,
          });
        }

        return uniqueItems;
      }
      return [];
    },
  });

  const upsertCatalogItem = React.useCallback(
    (id: string, record: InquiryConfigRecord) => {
      queryClient.setQueryData<AvailableInquiryItem[]>(
        ["cbs", "inquiry-config", "catalog"],
        (prev = []) => {
          const desc = record.INQInfo?.description || id;
          const ctrl = record.INQInfo?.controllerName || "N/A";
          const colCount = record.INQDef?.length || 0;
          const existingIdx = prev.findIndex((item) => item.id === id);

          const newItem: AvailableInquiryItem = {
            id,
            label: `${desc} (${ctrl})`,
            details: `${colCount} columns • ${ctrl}`,
            record,
          };

          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = newItem;
            return updated;
          }
          return [newItem, ...prev];
        },
      );
    },
    [queryClient],
  );

  return {
    inquiriesPool,
    loadingCatalog,
    refreshCatalog: refetch,
    upsertCatalogItem,
  };
}
