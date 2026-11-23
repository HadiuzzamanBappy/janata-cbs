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
import type { FormFieldParameter } from "@/lib/data-schemas";
import type { WidgetOption } from "../types";

/**
 * Executes a cached inquiry query for model lookup parameters and maps rows to WidgetOption[].
 *
 * @param param Lookup parameter configuration from field specification.
 * @returns Array of resolved lookup options and query loading state.
 */
export function useModelLookup(param: FormFieldParameter | undefined, enabled: boolean = true) {
  const isTypeSupported = param?.type === "M" || param?.type === "A";
  const rawModel = param?.modelName?.trim() || (param?.type === "A" ? "LOOKUP" : "") || "";
  const cleanModel = rawModel.toUpperCase();
  const isModelLookup = isTypeSupported && Boolean(cleanModel);

  const query = useQuery({
    ...cbsQueries.model(cleanModel).lookup(),
    enabled: isModelLookup && enabled,
  });

  const rows = isModelLookup ? query.data : undefined;
  const loading = isModelLookup ? query.isLoading : false;
  const refetch = isModelLookup
    ? query.refetch
    : () =>
        Promise.resolve({ data: undefined, error: null } as unknown as ReturnType<
          typeof query.refetch
        >);

  const modelOptions = React.useMemo<WidgetOption[]>(() => {
    if (!isModelLookup || !rows) return [];

    let filtered = rows;

    // 1. Filter by recordId if specified (for Category / Array Mode A)
    const targetId = param?.recordId?.trim();
    if (targetId) {
      filtered = rows.filter((item) => {
        const rec = item as Record<string, unknown>;
        const recId = String(rec.id ?? rec.recordId ?? rec.category ?? "")
          .trim()
          .toLowerCase();
        return recId === targetId.toLowerCase();
      });
    }

    // 2. Filter by condition expression if specified
    if (param?.condition) {
      const match = param.condition.trim().match(/^(\w+)\s*(===|==)\s*['"]([^'"]+)['"]$/i);
      if (match) {
        const [, fieldKey, , expectedVal] = match;
        filtered = filtered.filter((item) => {
          const rec = item as Record<string, unknown>;
          const actual =
            rec[fieldKey] ?? rec[fieldKey.toLowerCase()] ?? rec[fieldKey.toUpperCase()];
          return String(actual ?? "").toLowerCase() === expectedVal.toLowerCase();
        });
      }
    }

    // 3. Extract items: if Array Mode A, arrayField specified, or single-record auto-detect
    let itemsToMap: unknown[] = filtered;
    const arrayKey = param?.arrayField?.trim() || (param?.type === "A" ? "itemArray" : "");

    if (arrayKey && filtered.length > 0) {
      const targetRecord = filtered[0] as Record<string, unknown>;
      const nested = targetRecord[arrayKey] ?? targetRecord[arrayKey.toLowerCase()];
      if (Array.isArray(nested)) {
        itemsToMap = nested;
      }
    } else if (filtered.length === 1) {
      // Smart auto-detect: if a single record holds an itemArray, unwrap it automatically
      const rec = filtered[0] as Record<string, unknown>;
      if (Array.isArray(rec.itemArray)) {
        itemsToMap = rec.itemArray;
      }
    }

    const codeKey = String(param?.codeField || (param?.type === "A" ? "itemCode" : "id"));
    const displayKey = String(
      param?.displayField || (param?.type === "A" ? "itemLabel" : "description"),
    );

    return itemsToMap
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return { code: String(item), label: String(item) };
        }
        const rec = item as Record<string, unknown>;
        if (rec.isActive === false) return null;
        const codeVal =
          rec[codeKey] ??
          rec[codeKey.toLowerCase()] ??
          rec.itemCode ??
          rec.id ??
          rec.recordId ??
          rec.code ??
          "";
        const labelVal =
          rec[displayKey] ??
          rec[displayKey.toLowerCase()] ??
          rec.itemLabel ??
          rec.name ??
          rec.title ??
          rec.description ??
          codeVal;
        return {
          code: String(codeVal),
          label: String(labelVal || codeVal),
        };
      })
      .filter((o): o is WidgetOption => Boolean(o?.code));
  }, [
    isModelLookup,
    rows,
    param?.type,
    param?.recordId,
    param?.arrayField,
    param?.condition,
    param?.codeField,
    param?.displayField,
  ]);

  return { modelOptions, loading, refetch };
}
