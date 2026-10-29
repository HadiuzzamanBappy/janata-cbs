"use client";

import { useQuery } from "@tanstack/react-query";
import { cbs } from "@/lib/cbs-client";
import { resolveFormRecord } from "@/lib/cbs-form-spec";
import type { FormConfigRecord, ModelConfigRecord } from "@/lib/data-schemas";

export interface UseFormSchemaResult {
  schema: FormConfigRecord | null;
  modelRecord: ModelConfigRecord | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

interface ResolvedFormSchemaData {
  schema: FormConfigRecord | null;
  modelRecord: ModelConfigRecord | null;
}

export function useFormSchema(command: string): UseFormSchemaResult {
  const cleanCmd = command ? command.trim().toUpperCase() : "";

  const { data, isLoading, error, refetch } = useQuery<ResolvedFormSchemaData>({
    queryKey: ["cbs", "form-schema", cleanCmd],
    enabled: Boolean(cleanCmd),
    queryFn: async () => {
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
              }
            } catch {
              // Model is optional when form layout is standalone
            }

            const compiled = resolveFormRecord(formConfig, model);
            return { schema: compiled, modelRecord: model };
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
        const compiled = resolveFormRecord(model, null);
        return { schema: compiled, modelRecord: model };
      }

      throw new Error(
        modelRes.message || `No data model schema registered in MODEL.CONFIG for "${baseModel}"`,
      );
    },
  });

  return {
    schema: data?.schema ?? null,
    modelRecord: data?.modelRecord ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
