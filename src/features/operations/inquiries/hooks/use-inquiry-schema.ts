"use client";

import { useQuery } from "@tanstack/react-query";
import { cbs } from "@/lib/cbs-client";
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
      const res = await cbs.send<InquiryConfigRecord>(cbs.inquiryConfig.get(cleanCmd), {
        silent: true,
      });

      if (res.status === "SUCCESS" && res.data) {
        return res.data;
      }

      throw new Error(res.message || `Failed to fetch inquiry schema for "${cleanCmd}" via proxy`);
    },
  });

  return {
    schema: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
