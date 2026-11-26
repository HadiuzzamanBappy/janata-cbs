/**
 * @fileoverview Field Options Resolver Hook
 * @module form-engine/hooks/use-field-options
 *
 * Core Invariants:
 * - Direct 1:1 alignment with FormFieldParameter ("O" fixed options, "M" model lookup, "A" array lookup).
 * - Delegates dynamic lookup fetching to useModelLookup.
 * - Maps static option lists into canonical WidgetOption[] ({ code, label }).
 */

import { useMemo } from "react";
import { CBS_PARAMETER_TYPE, type FormElement, type FormFieldParameter } from "@/lib/data-schemas";
import type { WidgetOption } from "../types";
import { useModelLookup } from "./use-model-lookup";

/**
 * Resolves option choices for select, radio, and checkbox-group widgets.
 *
 * @param field FormElement containing optional PARAMETER configuration.
 * @returns Resolved options array and asynchronous loading status.
 */
export function useFieldOptions(field: FormElement, enabled: boolean = true) {
  const modelName = (field.MODELNAME || "").trim();
  const param =
    (field.PARAMETER as FormFieldParameter | undefined) ??
    (modelName ? { type: CBS_PARAMETER_TYPE.MODEL, modelName, data: [] } : undefined);
  const isDynamic = Boolean(
    (param?.type === CBS_PARAMETER_TYPE.MODEL || param?.type === CBS_PARAMETER_TYPE.ARRAY) &&
      Boolean(param?.modelName?.trim() || param?.recordId?.trim()),
  );
  const {
    modelOptions,
    loading: modelLoading,
    refetch,
  } = useModelLookup(param, isDynamic && enabled);

  const resolvedOptions: WidgetOption[] = useMemo(() => {
    const pType = param?.type;
    const pData = param?.data;

    if (pType === CBS_PARAMETER_TYPE.MODEL || pType === CBS_PARAMETER_TYPE.ARRAY) {
      return modelOptions;
    }

    if (pType === CBS_PARAMETER_TYPE.OPTIONS && Array.isArray(pData) && pData.length > 0) {
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
    modelLoading: isDynamic ? modelLoading : false,
    refetch,
    isDynamic,
  };
}
