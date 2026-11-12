"use client";

import { useQuery } from "@tanstack/react-query";
import { cbsQueries } from "@/lib/cbs-client";
import type { FormConfigRecord, ModelConfigRecord } from "@/lib/data-schemas";

export interface UseFormSchemaResult {
  schema: FormConfigRecord | null;
  modelRecord: ModelConfigRecord | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

export function useFormSchema(command: string): UseFormSchemaResult {
  const { data, isLoading, error, refetch } = useQuery(cbsQueries.formConfig.schema(command));

  return {
    schema: data?.schema ?? null,
    modelRecord: data?.modelRecord ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
