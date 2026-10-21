"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { resolveFormRecord } from "@/lib/cbs-form-spec";
import type { CompiledFormSpec } from "@/lib/data-schemas";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export function useFormSpec(command: string) {
  const [spec, setSpec] = React.useState<CompiledFormSpec | null>(null);
  const [modelRecord, setModelRecord] = React.useState<ModelConfigRecord | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSpec = React.useCallback(async () => {
    if (!command) {
      setSpec(null);
      setModelRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanCmd = command.trim().toUpperCase();

      // 1. First, check if a Form Configuration exists for this exact command
      const formRes = await cbs.send<FormConfigRecord>(cbs.formConfig.get(cleanCmd), {
        silent: true,
      });

      if (formRes.status === "SUCCESS" && formRes.data && "presentation" in formRes.data) {
        const formConfig = formRes.data;
        const targetModelName = String(formConfig.targetModel || cleanCmd.split(",")[0] || cleanCmd).trim().toUpperCase();

        // Fetch underlying model schema to enrich validation rules
        let model: ModelConfigRecord | null = null;
        try {
          const modelRes = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(targetModelName), {
            silent: true,
          });
          if (modelRes.status === "SUCCESS" && modelRes.data) {
            model = modelRes.data;
            setModelRecord(model);
          }
        } catch {
          // Model fetch is optional; fallback to formConfig standalone
        }

        const compiled = resolveFormRecord(formConfig, model);
        setSpec(compiled);
        return;
      }

      // 2. Otherwise, check if it is a pure Model Config (raw table schema)
      const baseModel = cleanCmd.split(",")[0].trim();
      const modelRes = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(baseModel), {
        silent: true,
      });

      if (modelRes.status === "SUCCESS" && modelRes.data && "properties" in modelRes.data) {
        const model = modelRes.data;
        setModelRecord(model);
        const compiled = resolveFormRecord(model, null);
        setSpec(compiled);
        return;
      }

      throw new Error(
        modelRes.message || `Neither Form Config nor Model Schema found for "${cleanCmd}"`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error resolving form specification");
      setSpec(null);
      setModelRecord(null);
    } finally {
      setLoading(false);
    }
  }, [command]);

  React.useEffect(() => {
    fetchSpec();
  }, [fetchSpec]);

  return { spec, modelRecord, loading, error, refetch: fetchSpec };
}
