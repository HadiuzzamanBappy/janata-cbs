"use client";

import { useQuery } from "@tanstack/react-query";
import { cbsQueries } from "@/lib/cbs-client";
import { cbsCommand } from "@/lib/cbs-command";

export function useInquirySchema(command: string) {
  const parsed = cbsCommand.parse(command);
  const cleanCmd = (parsed.application || command).trim().toUpperCase();

  const { data, isLoading, error, refetch } = useQuery(cbsQueries.inquiryConfig.schema(cleanCmd));

  return {
    schema: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
