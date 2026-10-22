"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export function useFcModelBinding(targetModelName: string) {
  const [targetModelRecord, setTargetModelRecord] = React.useState<ModelConfigRecord | null>(null);
  const [loadingModel, setLoadingModel] = React.useState<boolean>(false);

  React.useEffect(() => {
    const cleanTarget = (targetModelName || "").trim().toUpperCase();
    if (!cleanTarget) {
      setTargetModelRecord(null);
      return;
    }

    let isMounted = true;
    setLoadingModel(true);

    cbs
      .send<ModelConfigRecord>(cbs.modelConfig.get(cleanTarget), { silent: true })
      .then((res) => {
        if (!isMounted) return;
        if (res.status === "SUCCESS" && res.data) {
          setTargetModelRecord(res.data);
        } else {
          setTargetModelRecord(null);
        }
      })
      .catch(() => {
        if (isMounted) setTargetModelRecord(null);
      })
      .finally(() => {
        if (isMounted) setLoadingModel(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetModelName]);

  return {
    targetModelRecord,
    loadingModel,
  };
}
