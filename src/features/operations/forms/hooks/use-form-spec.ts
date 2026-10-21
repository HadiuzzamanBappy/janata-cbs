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
      const hasExplicitVersion =
        cleanCmd.includes(",") && cleanCmd.split(",")[1].trim().length > 0;
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

      // 2. Fetch Form layout presentation from CBS Form Config ONLY when explicit MODEL,VERSION is specified
      let formConfig: FormConfigRecord | null = null;
      if (hasExplicitVersion) {
        const formRes = await cbs.send<FormConfigRecord>(cbs.formConfig.get(layoutCode), {
          silent: true,
        });
        if (formRes.status === "SUCCESS" && formRes.data) {
          formConfig = formRes.data;
        } else {
          throw new Error(
            `Form configuration "${layoutCode}" is not registered in FORM.CONFIG`,
          );
        }
      }

      // 3. Compile Model + Layout into canonical CompiledFormSpec
      // - When cleanCmd is direct model (e.g. "ACCOUNT"): formConfig is null -> renders raw model field spec
      // - When cleanCmd is versioned (e.g. "ACCOUNT,1.0.0"): compiles customized layout against the model
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
