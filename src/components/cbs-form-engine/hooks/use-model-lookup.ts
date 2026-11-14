/**
 * @fileoverview Dynamic Model Lookup Query Hook
 * @module form-engine/hooks/use-model-lookup
 *
 * Core Invariants:
 * - Resolves dynamic CBS model lookup options when parameter.type === 'M' or 'L'.
 * - Backed by centralized cbsQueries so multiple fields referencing the same lookup table
 *   share one cached React Query request.
 * - Evaluates custom in-memory condition filtering (e.g. "STATUS == 'ACTIVE'").
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbsQueries } from "@/lib/cbs-client";
import type { FormFieldParameter } from "@/lib/data-schemas/form-engine-schema";
import type { WidgetOption } from "../types";

/**
 * Executes a cached inquiry query for model lookup parameters and maps rows to WidgetOption[].
 *
 * @param param Lookup parameter configuration from field specification.
 * @returns Array of resolved lookup options and query loading state.
 */
export function useModelLookup(param: FormFieldParameter | undefined) {
  const isModelLookup =
    (param?.type === "M" || param?.type === "L") && Boolean(param.modelName?.trim());
  const cleanModel = isModelLookup ? (param?.modelName || "").trim().toUpperCase() : "";

  const { data: payload, isLoading: loading } = useQuery(cbsQueries.model(cleanModel).lookup());

  const modelOptions = React.useMemo<WidgetOption[]>(() => {
    if (!isModelLookup || !payload) return [];

    if (payload.kind === "metamodel") {
      return payload.properties
        .map((p) => {
          const codeVal = p.NAME || p.SN;
          const labelVal = p.LABEL || p.NAME;
          return {
            code: String(codeVal ?? ""),
            label: String(labelVal ?? codeVal ?? ""),
          };
        })
        .filter((o) => Boolean(o.code));
    }

    let filtered = payload.rows;
    if (param?.condition) {
      const match = param.condition.trim().match(/^(\w+)\s*(===|==)\s*['"]([^'"]+)['"]$/i);
      if (match) {
        const [, fieldKey, , expectedVal] = match;
        filtered = payload.rows.filter((item) => {
          const rec = item as Record<string, unknown>;
          const actual =
            rec[fieldKey] ?? rec[fieldKey.toLowerCase()] ?? rec[fieldKey.toUpperCase()];
          return String(actual ?? "").toLowerCase() === expectedVal.toLowerCase();
        });
      }
    }

    const codeKey = String(param?.codeField || param?.reference || "id");
    const displayKey = String(param?.displayField || "description");

    return filtered
      .map((item) => {
        const rec = item as Record<string, unknown>;
        const codeVal =
          rec[codeKey] ?? rec[codeKey.toLowerCase()] ?? rec.id ?? rec.recordId ?? rec.code ?? "";
        const labelVal =
          rec[displayKey] ??
          rec[displayKey.toLowerCase()] ??
          rec.name ??
          rec.title ??
          rec.description ??
          codeVal;
        return {
          code: String(codeVal),
          label: String(labelVal || codeVal),
        };
      })
      .filter((o) => Boolean(o.code));
  }, [
    isModelLookup,
    payload,
    param?.condition,
    param?.codeField,
    param?.reference,
    param?.displayField,
  ]);

  return { modelOptions, loading };
}
