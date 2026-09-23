"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormSchema } from "../types";

export function useSchema(command: string) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
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
      const cleanCmd = command.split(",")[0].trim().toUpperCase();
      const res = await fetch(`/api/model/${cleanCmd}`);
      const json = await res.json();

      if (json.success && json.data) {
        setSchema(json.data);
      } else {
        setError(json.error || `Failed to fetch schema for ${cleanCmd}`);
      }
    } catch (err: any) {
      setError(err?.message || "Network error fetching schema");
    } finally {
      setLoading(false);
    }
  }, [command]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return { schema, loading, error, refetch: fetchSchema };
}
