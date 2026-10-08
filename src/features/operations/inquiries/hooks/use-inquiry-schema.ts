"use client";

import { useCallback, useEffect, useState } from "react";
import { appConfig } from "@/lib/config";
import type { EnquirySchema } from "@/lib/schemas";

export function useInquirySchema(command: string) {
  const [schema, setSchema] = useState<EnquirySchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!command) {
      setSchema(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Clean command: strip INQ and record functions (e.g. S, R) to get recordId
      const cleanCmd = command
        .split(",")[0]
        .trim()
        .toUpperCase()
        .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
        .replace(/^(?:[SRIDAH]\s+)/i, "")
        .trim();

      // 2. Fetch schema from dedicated inquiry endpoint
      const res = await fetch(`${appConfig.routes.api.inquiry}/${cleanCmd}`);
      const json = await res.json();

      if (json.success && json.data) {
        setSchema(json.data);
      } else {
        setError(json.error || `Failed to fetch enquiry schema for ${cleanCmd}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error fetching enquiry schema");
    } finally {
      setLoading(false);
    }
  }, [command]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return { schema, loading, error, refetch: fetchSchema };
}

export const useEnquirySchema = useInquirySchema;
