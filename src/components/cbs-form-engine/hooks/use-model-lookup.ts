/**
 * @fileoverview Dynamic Model Lookup Query Hook
 * @module form-engine/hooks/use-model-lookup
 *
 * Core Invariants:
 * - Resolves dynamic CBS model lookup options when parameter.type === 'M' or 'A'.
 * - Backed by centralized cbsQueries so multiple fields referencing the same lookup table
 *   share one cached React Query request.
 * - Evaluates custom in-memory condition filtering (e.g. "STATUS == 'ACTIVE'").
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbsQueries } from "@/lib/cbs-client";
import {
  CBS_PARAMETER_TYPE,
  DEFAULT_ARRAY_LOOKUP_MODEL,
  type FormFieldParameter,
} from "@/lib/data-schemas";
import type { WidgetOption } from "../types";

/**
 * Executes a cached inquiry query for model lookup parameters and maps rows to WidgetOption[].
 *
 * @param param Lookup parameter configuration from field specification.
 * @returns Array of resolved lookup options and query loading state.
 */
export function useModelLookup(param: FormFieldParameter | undefined, enabled: boolean = true) {
  const isTypeSupported =
    param?.type === CBS_PARAMETER_TYPE.MODEL || param?.type === CBS_PARAMETER_TYPE.ARRAY;
  const rawModel =
    param?.modelName?.trim() ||
    (param?.type === CBS_PARAMETER_TYPE.ARRAY ? DEFAULT_ARRAY_LOOKUP_MODEL : "") ||
    "";
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

    // 2. Extract items based strictly on configured type:
    // - Mode A (Array Mode): unwrap from specified arrayField (or default itemArray) within target record
    // - Mode M (Flat Mode): use records directly as options without magic auto-detect
    let itemsToMap: unknown[] = filtered;
    const isArrayMode =
      param?.type === CBS_PARAMETER_TYPE.ARRAY || Boolean(param?.recordId?.trim());

    if (isArrayMode) {
      const arrayKey = param?.arrayField?.trim() || "itemArray";
      if (filtered.length > 0) {
        const targetRecord = filtered[0] as Record<string, unknown>;
        const nested = targetRecord[arrayKey] ?? targetRecord[arrayKey.toLowerCase()];
        if (Array.isArray(nested)) {
          itemsToMap = nested;
        } else {
          // If array mode was requested but arrayField not found on record, return empty
          itemsToMap = [];
        }
      } else {
        itemsToMap = [];
      }
    }

    // 3. Filter items by condition expression if specified (works for flat records AND array items)
    if (param?.condition) {
      const match = param.condition.trim().match(/^(\w+)\s*(===|==)\s*['"]([^'"]+)['"]$/i);
      if (match) {
        const [, fieldKey, , expectedVal] = match;
        itemsToMap = itemsToMap.filter((item) => {
          if (typeof item !== "object" || item === null) return true;
          const rec = item as Record<string, unknown>;
          const actual =
            rec[fieldKey] ?? rec[fieldKey.toLowerCase()] ?? rec[fieldKey.toUpperCase()];
          return String(actual ?? "").toLowerCase() === expectedVal.toLowerCase();
        });
      }
    }

    // Default code & display keys
    const rawCode = param?.codeField !== undefined ? String(param.codeField).trim() : "";
    const rawDisplay = param?.displayField?.trim() || "";
    const codeKey = rawCode || (isArrayMode ? "itemCode" : "id");
    const displayKey = rawDisplay || (isArrayMode ? "itemLabel" : "name");

    return itemsToMap
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return { code: String(item), label: String(item) };
        }
        const rec = item as Record<string, unknown>;
        const codeVal =
          rec[codeKey] ??
          rec[codeKey.toLowerCase()] ??
          rec[codeKey.toUpperCase()] ??
          (rawCode
            ? ""
            : (rec.id ?? rec.recordId ?? rec.code ?? rec.branchCode ?? rec.itemCode ?? ""));
        const labelVal =
          rec[displayKey] ??
          rec[displayKey.toLowerCase()] ??
          rec[displayKey.toUpperCase()] ??
          ((rawDisplay
            ? ""
            : (rec.name ??
              rec.title ??
              rec.branchTitle ??
              rec.description ??
              rec.itemLabel ??
              "")) ||
            codeVal);
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
