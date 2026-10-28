"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: modelsPool = [], refetch } = useQuery<ModelCatalogItem[]>({
    queryKey: ["cbs", "model-config", "catalog"],
    queryFn: async () => {
      const res = await cbs.send<ModelCatalogItem[]>(cbs.modelConfig.list(), {
        silent: true,
      });
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    },
  });

  const upsertCatalogItem = React.useCallback(
    (item: ModelCatalogItem) => {
      queryClient.setQueryData<ModelCatalogItem[]>(
        ["cbs", "model-config", "catalog"],
        (prev = []) => {
          const exists = prev.some((p) => p.id === item.id);
          return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item];
        },
      );
    },
    [queryClient],
  );

  return {
    modelsPool,
    refreshCatalog: refetch,
    upsertCatalogItem,
  };
}
