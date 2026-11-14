/**
 * @fileoverview Field Options Resolver Hook
 * @module form-engine/hooks/use-field-options
 *
 * Core Invariants:
 * - Direct 1:1 alignment with FormFieldParameter ("O" fixed options, "M" / "L" model lookups).
 * - Delegates dynamic lookup fetching to useModelLookup.
 * - Maps static option lists into canonical WidgetOption[] ({ code, label }).
 */

import { useMemo } from "react";
import type { FormElement, FormFieldParameter } from "@/lib/data-schemas/form-engine-schema";
import type { WidgetOption } from "../types";
import { useModelLookup } from "./use-model-lookup";

/**
 * Resolves option choices for select, radio, and checkbox-group widgets.
 *
 * @param field FormElement containing optional PARAMETER configuration.
 * @returns Resolved options array and asynchronous loading status.
 */
export function useFieldOptions(field: FormElement) {
  const param = field.PARAMETER as FormFieldParameter | undefined;
  const { modelOptions, loading: modelLoading } = useModelLookup(param);

  const resolvedOptions: WidgetOption[] = useMemo(() => {
    const pType = param?.type;
    const pData = param?.data;

    if (pType === "M" || pType === "L") {
      return modelOptions;
    }

    if (pType === "O" && Array.isArray(pData) && pData.length > 0) {
      return pData.map((d) => ({
        code: String(d.code ?? ""),
        label: String(d.label ?? d.code ?? ""),
      }));
    }

    return [];
  }, [param, modelOptions]);

  return {
    param,
    resolvedOptions,
    modelLoading,
  };
}
