"use client";

import * as React from "react";
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
  const [availableForms, setAvailableForms] = React.useState<FormCatalogItem[]>([]);
  const [availableModels, setAvailableModels] = React.useState<ModelCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState<boolean>(false);

  const refreshForms = React.useCallback(async () => {
    try {
      const res = await cbs.send<
        Array<{ id: string; label?: string; details?: string; targetModel?: string }>
      >(cbs.formConfig.list(), { silent: true });
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        setAvailableForms(
          res.data.map((item) => ({
            id: item.id,
            label: item.label || item.id,
            details: item.details,
            targetModel: item.targetModel,
          })),
        );
      }
    } catch {
      // Graceful offline fallback
    }
  }, []);

  const refreshModels = React.useCallback(async () => {
    try {
      const res = await cbs.send<Array<{ id: string; label?: string; record?: ModelConfigRecord }>>(
        cbs.modelConfig.list(),
        { silent: true },
      );
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        setAvailableModels(
          res.data.map((item) => {
            const rec = item.record;
            const tableName = rec?.tableName || item.id;
            const isAuthorized = rec?.auditData?.recStatus === "AU";
            return {
              id: item.id,
              tableName,
              label: item.label || `${tableName} (${rec?.description || item.id})`,
              isAuthorized,
            };
          }),
        );
      }
    } catch {
      // Graceful offline fallback
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    setLoadingCatalog(true);
    Promise.all([refreshForms(), refreshModels()]).finally(() => {
      if (mounted) setLoadingCatalog(false);
    });
    return () => {
      mounted = false;
    };
  }, [refreshForms, refreshModels]);

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
    loadingCatalog,
    refreshForms,
    refreshModels,
  };
}
