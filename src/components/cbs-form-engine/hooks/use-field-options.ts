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
import {
  type FormElement,
  isLookupParameter,
  resolveFieldParameter,
  staticOptionsOf,
} from "@/lib/data-schemas";
import type { WidgetOption } from "../types";
import { useModelLookup } from "./use-model-lookup";

/**
 * Resolves option choices for select, radio, and checkbox-group widgets.
 *
 * @param field FormElement containing optional PARAMETER configuration.
 * @returns Resolved options array and asynchronous loading status.
 */
export function useFieldOptions(field: FormElement, enabled: boolean = true) {
  const param = resolveFieldParameter(field.PARAMETER, field.MODELNAME);
  // Refreshable: a lookup that names its model or its record
  const isDynamic =
    isLookupParameter(param) && Boolean(param.modelName?.trim() || param.recordId?.trim());
  const {
    modelOptions,
    loading: modelLoading,
    refetch,
  } = useModelLookup(param, isDynamic && enabled);

  const resolvedOptions: WidgetOption[] = useMemo(() => {
    if (isLookupParameter(param)) return modelOptions;
    return staticOptionsOf(param).map((d) => ({
      code: String(d.code ?? ""),
      label: String(d.label ?? d.code ?? ""),
    }));
  }, [param, modelOptions]);

  return {
    param,
    resolvedOptions,
    modelLoading: isDynamic ? modelLoading : false,
    refetch,
    isDynamic,
  };
}
