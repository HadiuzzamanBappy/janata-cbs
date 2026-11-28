"use client";

import { useQuery } from "@tanstack/react-query";
import { cbsQueries } from "@/lib/cbs-client";
import type { FormConfigRecord } from "@/lib/data-schemas";

export interface UseFormSchemaResult {
  schema: FormConfigRecord | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

export function useFormSchema(command: string): UseFormSchemaResult {
  const { data, isLoading, error, refetch } = useQuery(cbsQueries.formConfig.schema(command));

  return {
    schema: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
