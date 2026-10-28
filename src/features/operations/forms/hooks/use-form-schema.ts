"use client";

import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { resolveFormRecord } from "@/lib/cbs-form-spec";
import type { FormConfigRecord, ModelConfigRecord } from "@/lib/data-schemas";

export interface UseFormSchemaResult {
  schema: FormConfigRecord | null;
  modelRecord: ModelConfigRecord | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFormSchema(command: string): UseFormSchemaResult {
  const [schema, setSchema] = React.useState<FormConfigRecord | null>(null);
  const [modelRecord, setModelRecord] = React.useState<ModelConfigRecord | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSchema = React.useCallback(async () => {
    if (!command) {
      setSchema(null);
      setModelRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanCmd = command.trim().toUpperCase();

      // Case 1: Command has explicit layout version (e.g., ACCOUNT,1.0.0)
      if (cleanCmd.includes(",")) {
        const [app, version] = cleanCmd.split(",");
        if (version?.trim()) {
          const formRes = await cbs.send<FormConfigRecord>(cbs.formConfig.get(cleanCmd), {
            silent: true,
          });

          if (formRes.status === "SUCCESS" && formRes.data && "frmElements" in formRes.data) {
            const formConfig = formRes.data;
            const targetModelName = String(app || cleanCmd)
              .trim()
              .toUpperCase();

            let model: ModelConfigRecord | null = null;
            try {
              const modelRes = await cbs.send<ModelConfigRecord>(
                cbs.modelConfig.get(targetModelName),
                { silent: true },
              );
              if (modelRes.status === "SUCCESS" && modelRes.data) {
                model = modelRes.data;
                setModelRecord(model);
              }
            } catch {
              // Model is optional when form layout is standalone
            }

            const compiled = resolveFormRecord(formConfig, model);
            setSchema(compiled);
            return;
          }

          throw new Error(
            `Version "${cleanCmd}" does not exist in FORM.CONFIG. Please verify the version or create it in Form Design.`,
          );
        }
      }

      // Case 2: Base Model Application (e.g. ACCOUNT, CUSTOMER)
      const baseModel = cleanCmd.split(",")[0].trim();
      const modelRes = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(baseModel), {
        silent: true,
      });

      if (modelRes.status === "SUCCESS" && modelRes.data && "PROPERTIES" in modelRes.data) {
        const model = modelRes.data;
        setModelRecord(model);
        const compiled = resolveFormRecord(model, null);
        setSchema(compiled);
        return;
      }

      throw new Error(
        modelRes.message || `No data model schema registered in MODEL.CONFIG for "${baseModel}"`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error resolving form specification");
      setSchema(null);
      setModelRecord(null);
    } finally {
      setLoading(false);
    }
  }, [command]);

  React.useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return { schema, modelRecord, loading, error, refetch: fetchSchema };
}
