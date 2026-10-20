"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { type FormLayoutIssue, validateLayoutAgainstModel } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export function useFcModelBinding(targetModelName: string, formData: FormConfigRecord) {
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

  const layoutIssues = React.useMemo<FormLayoutIssue[]>(() => {
    if (!targetModelRecord) return [];
    return validateLayoutAgainstModel(targetModelRecord, formData);
  }, [targetModelRecord, formData]);

  const staleIssues = React.useMemo(() => {
    return layoutIssues.filter(
      (i) =>
        i.code === "ARCHIVED_PROPERTY" ||
        i.code === "MISSING_PROPERTY" ||
        i.code === "STALE_MODEL_VERSION",
    );
  }, [layoutIssues]);

  return {
    targetModelRecord,
    loadingModel,
    layoutIssues,
    staleIssues,
    isStale: staleIssues.length > 0,
  };
}
