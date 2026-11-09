"use client";

import { useQuery } from "@tanstack/react-query";
import { cbs } from "@/lib/cbs-client";
import { cbsCommand } from "@/lib/cbs-command";
import { parseInquiryConfig } from "@/lib/data-parsers";
import type { InquiryConfigRecord } from "@/lib/data-schemas";

export function useInquirySchema(command: string) {
  const parsed = cbsCommand.parse(command);
  const cleanCmd = (parsed.target || parsed.application || command).trim().toUpperCase();

  const { data, isLoading, error, refetch } = useQuery<InquiryConfigRecord>({
    queryKey: ["cbs", "inquiry-schema", cleanCmd],
    enabled: Boolean(cleanCmd),
    queryFn: async () => {
      const res = await cbs.send<unknown>(cbs.inquiryConfig.get(cleanCmd), {
        silent: true,
      });

      if (res.status === "SUCCESS" && res.data) {
        const parsedRecord = parseInquiryConfig(res.data);
        if (parsedRecord.success) {
          return parsedRecord.data;
        }
        return res.data as InquiryConfigRecord;
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
