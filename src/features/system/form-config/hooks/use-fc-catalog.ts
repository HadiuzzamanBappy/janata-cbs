"use client";

import { useQuery } from "@tanstack/react-query";
import { cbs } from "@/lib/cbs-client";
import { useRecordMutationSubscriber } from "@/lib/cbs-screen";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface FormCatalogItem {
  id: string;
  label: string;
  details?: string;
  targetModel?: string;
}

export interface ModelCatalogItem {
  id: string;
  label: string;
  tableName: string;
  isAuthorized: boolean;
}

export function useFcCatalog() {
  const {
    data: availableForms = [],
    isLoading: loadingForms,
    refetch: refreshForms,
  } = useQuery<FormCatalogItem[]>({
    queryKey: ["cbs", "form-config", "catalog"],
    queryFn: async () => {
      const res = await cbs.send<
        Array<{ id: string; label?: string; details?: string; targetModel?: string }>
      >(cbs.formConfig.list(), { silent: true });
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        return res.data.map((item) => ({
          id: item.id,
          label: item.label || item.id,
          details: item.details,
          targetModel: item.targetModel,
        }));
      }
      return [];
    },
  });

  const {
    data: availableModels = [],
    isLoading: loadingModels,
    refetch: refreshModels,
  } = useQuery<ModelCatalogItem[]>({
    queryKey: ["cbs", "model-config", "catalog-models"],
    queryFn: async () => {
      const res = await cbs.send<Array<{ id: string; label?: string; record?: ModelConfigRecord }>>(
        cbs.modelConfig.list(),
        { silent: true },
      );
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        return res.data.map((item) => {
          const rec = item.record;
          const tableName = rec?.TABLENAME || item.id;
          const isAuthorized = rec?.auditData?.recStatus === "AU";
          return {
            id: item.id,
            tableName,
            label: item.label || `${tableName} (${rec?.DESCRIPTION || item.id})`,
            isAuthorized,
          };
        });
      }
      return [];
    },
  });

  // Subscribe to cross-tab updates for FORM.CONFIG and MODEL.CONFIG
  useRecordMutationSubscriber(() => {
    refreshForms();
  }, "FORM.CONFIG");
  useRecordMutationSubscriber(() => {
    refreshModels();
  }, "MODEL.CONFIG");

  return {
    availableForms,
    availableModels,
    loadingCatalog: loadingForms || loadingModels,
    refreshForms: async () => {
      await refreshForms();
    },
    refreshModels: async () => {
      await refreshModels();
    },
  };
}
