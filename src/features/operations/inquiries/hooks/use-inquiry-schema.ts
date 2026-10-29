"use client";

import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/lib/core-config";
import type { InquiryConfigRecord } from "@/lib/data-schemas";

export function useInquirySchema(command: string) {
  const cleanCmd = command
    ? command
        .split(",")[0]
        .trim()
        .toUpperCase()
        .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
        .replace(/^(?:[SRIDAH]\s+)/i, "")
        .trim()
    : "";

  const { data, isLoading, error, refetch } = useQuery<InquiryConfigRecord>({
    queryKey: ["cbs", "inquiry-schema", cleanCmd],
    enabled: Boolean(cleanCmd),
    queryFn: async () => {
      const res = await fetch(`${appConfig.routes.api.inquiry}/${encodeURIComponent(cleanCmd)}`);
      const json = await res.json();

      if ((json.status === "SUCCESS" || json.success) && json.data) {
        return json.data;
      }

      throw new Error(
        json.message || json.error || `Failed to fetch inquiry schema for ${cleanCmd}`,
      );
    },
  });

  return {
    schema: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
