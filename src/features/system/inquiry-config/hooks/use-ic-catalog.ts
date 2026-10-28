"use client";

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
  const [inquiriesPool, setInquiriesPool] = React.useState<AvailableInquiryItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState<boolean>(false);

  const refreshCatalog = React.useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await cbs.send<Record<string, InquiryConfigRecord> | InquiryConfigRecord[]>(
        cbs.inquiryConfig.list(),
        { silent: true },
      );

      if (res.status === "SUCCESS" && res.data) {
        const rawList: Array<[string, InquiryConfigRecord]> = Array.isArray(res.data)
          ? res.data.map((item) => [item.INQInfo?.controllerName || "UNKNOWN", item])
          : Object.entries(res.data);

        setInquiriesPool(
          rawList.map(([key, record]) => {
            const id = key;
            const desc = record.INQInfo?.description || id;
            const ctrl = record.INQInfo?.controllerName || "N/A";
            const colCount = record.INQDef?.length || 0;

            return {
              id,
              label: `${desc} (${ctrl})`,
              details: `${colCount} columns • ${ctrl}`,
              record,
            };
          }),
        );
      }
    } catch {
      // Background catalog sync fails silently
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  React.useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const upsertCatalogItem = React.useCallback((id: string, record: InquiryConfigRecord) => {
    setInquiriesPool((prev) => {
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
    });
  }, []);

  return {
    inquiriesPool,
    loadingCatalog,
    refreshCatalog,
    upsertCatalogItem,
  };
}
