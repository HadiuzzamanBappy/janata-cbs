"use client";

import { useCallback, useEffect, useState } from "react";
import { appConfig } from "@/lib/config";
import type { EnquiryColumn, EnquirySchema, SelectionField, SelectionOperand } from "../types";

export function useEnquirySchema(command: string) {
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
      // 1. Clean command: strip ENQ or INQ prefix to get pure model name
      const cleanCmd = command
        .split(",")[0]
        .trim()
        .toUpperCase()
        .replace(/^(ENQ\s+|INQ\s+|ENQUIRY\s+|INQUIRY\s+)/i, "")
        .trim();

      // 2. Fetch from same dynamic backend endpoint as FormScreen
      const res = await fetch(`${appConfig.routes.api.model}/${cleanCmd}`);
      const json = await res.json();

      if (json.success && json.data) {
        const rawModel = json.data;
        const title = rawModel.title || cleanCmd;

        // Map form fields to selection filter criteria
        const selectionFields: SelectionField[] = (rawModel.fields || []).map(
          (field: { name: string; label: string; type: string; options?: string[] }) => {
            const isSelect = field.type === "select" || Boolean(field.options?.length);
            const isDate = field.type === "date";
            const isNum = field.type === "number";

            const operand: SelectionOperand = isDate ? "RG" : isSelect ? "EQ" : "LK";

            return {
              id: field.name,
              label: field.label || field.name,
              type: isSelect ? "select" : isDate ? "date" : isNum ? "number" : "text",
              operand,
              value: "",
              options: field.options?.map((opt) => ({ label: opt, value: opt })),
            };
          },
        );

        // Map columns (or fallback to fields)
        const columns: EnquiryColumn[] =
          rawModel.columns ||
          (rawModel.fields || []).map((f: { name: string; label: string }) => ({
            id: f.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_"),
            label: f.label || f.name,
          }));

        setSchema({
          code: cleanCmd,
          title,
          description: rawModel.title,
          selectionFields,
          columns,
        });
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
