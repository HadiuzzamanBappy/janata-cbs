"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface ModelCatalogItem {
  id: string;
  label: string;
  details: string;
  record?: ModelConfigRecord;
}

export function useMcCatalog() {
  const [modelsPool, setModelsPool] = React.useState<ModelCatalogItem[]>([]);

  const refreshCatalog = React.useCallback(async () => {
    try {
      const res = await cbs.send<ModelCatalogItem[]>(cbs.modelConfig.list(), {
        silent: true,
      });
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        setModelsPool(res.data);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  const upsertCatalogItem = React.useCallback((item: ModelCatalogItem) => {
    setModelsPool((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item];
    });
  }, []);


  return {
    modelsPool,
    refreshCatalog,
    upsertCatalogItem,
  };
}
