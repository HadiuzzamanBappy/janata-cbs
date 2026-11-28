/**
 * @fileoverview Dynamic Model Lookup Query Hook
 * @module form-engine/hooks/use-model-lookup
 *
 * Core Invariants:
 * - Resolves dynamic CBS model lookup options when parameter.type === 'M' or 'A'.
 * - Backed by centralized cbsQueries so multiple fields referencing the same lookup table
 *   share one cached React Query request.
 * - Rows become options in `resolveLookupOptions` (`@/lib/cbs-form-spec`), condition included.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbsQueries } from "@/lib/cbs-client";
import { resolveLookupOptions } from "@/lib/cbs-form-spec";
import { type FormFieldParameter, isLookupParameter, lookupModelOf } from "@/lib/data-schemas";
import type { WidgetOption } from "../types";

/**
 * Executes a cached query for a model lookup parameter and maps its rows to WidgetOption[].
 * `refetch` is meant for a lookup the field can refresh (`useFieldOptions`'s `isDynamic`).
 *
 * @param param Lookup parameter configuration from field specification.
 * @returns Array of resolved lookup options, the query loading state and its refetch.
 */
export function useModelLookup(param: FormFieldParameter | undefined, enabled: boolean = true) {
  const cleanModel = lookupModelOf(param).toUpperCase();
  const isModelLookup = isLookupParameter(param) && Boolean(cleanModel);

  const query = useQuery({
    ...cbsQueries.model(cleanModel).lookup(),
    enabled: isModelLookup && enabled,
  });

  const rows = isModelLookup ? query.data : undefined;
  const modelOptions = React.useMemo<WidgetOption[]>(
    () => resolveLookupOptions(rows, param),
    [rows, param],
  );

  return {
    modelOptions,
    loading: isModelLookup ? query.isLoading : false,
    refetch: query.refetch,
  };
}
