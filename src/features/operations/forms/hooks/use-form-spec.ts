"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { compileFormSpec } from "@/lib/cbs-form-spec";
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
      const baseModel = cleanCmd.split(",")[0].trim();
      const layoutCode = cleanCmd;

      // 1. Fetch Model definition from CBS Model Config
      const modelRes = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(baseModel), {
        silent: true,
      });

      if (modelRes.status !== "SUCCESS" || !modelRes.data) {
        throw new Error(
          modelRes.message || `Data model "${baseModel}" is not registered in MODEL.CONFIG`,
        );
      }

      const model = modelRes.data;
      setModelRecord(model);

      // 2. Fetch Form layout presentation from CBS Form Config (if defined)
      let formConfig: FormConfigRecord | null = null;
      try {
        const formRes = await cbs.send<FormConfigRecord>(cbs.formConfig.get(layoutCode), {
          silent: true,
        });
        if (formRes.status === "SUCCESS" && formRes.data) {
          formConfig = formRes.data;
        } else if (layoutCode !== `FC.${layoutCode}`) {
          // Try prefixed fallback "FC.<COMMAND>"
          const fallbackRes = await cbs.send<FormConfigRecord>(
            cbs.formConfig.get(`FC.${layoutCode}`),
            { silent: true },
          );
          if (fallbackRes.status === "SUCCESS" && fallbackRes.data) {
            formConfig = fallbackRes.data;
          }
        }
      } catch {
        // Safe: fallback to canonical dynamic 12-column grid layout
      }

      // 3. Compile Model + Layout into canonical CompiledFormSpec
      const compiled = compileFormSpec(model, formConfig);
      setSpec(compiled);
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
