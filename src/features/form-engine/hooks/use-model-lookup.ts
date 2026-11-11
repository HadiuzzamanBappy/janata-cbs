"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbsQueries } from "@/lib/cbs-client";
import type { FormFieldParameter } from "@/lib/data-schemas/model-config-schema";
import type { WidgetOption } from "../types";

/**
 * Resolves dynamic CBS model lookup options when parameter.type === 'M'.
 * Backed by centralized `cbsQueries.modelLookup` so multiple fields referencing the same
 * lookup table share one cached request, with per-field condition/display mapping in memory.
 */
export function useModelLookup(param: FormFieldParameter | undefined) {
  const isModelLookup = param?.type === "M" && Boolean(param.modelName?.trim());
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

    const codeKey = param?.codeField || param?.reference || "id";
    const displayKey = param?.displayField || "description";

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
