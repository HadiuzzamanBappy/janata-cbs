import { useMemo } from "react";
import type { FormElement, FormFieldParameter } from "@/lib/data-schemas/form-engine-schema";
import type { WidgetOption } from "../types";
import { useModelLookup } from "./use-model-lookup";

export function useFieldOptions(field: FormElement) {
  const param = field.PARAMETER as FormFieldParameter | undefined;
  const { modelOptions, loading: modelLoading } = useModelLookup(param);

  const resolvedOptions: WidgetOption[] = useMemo(() => {
    if (param?.type === "M") {
      return modelOptions;
    }
    if (param?.type === "O" && Array.isArray(param.data) && param.data.length > 0) {
      return param.data.map((d) => {
        const itemCode = "itemCode" in d ? d.itemCode : d.code;
        const itemLabel = "itemLabel" in d ? d.itemLabel : d.label;
        return {
          code: String(itemCode || ""),
          label: String(itemLabel || itemCode || ""),
        };
      });
    }
    return [];
  }, [param, modelOptions]);

  return {
    param,
    resolvedOptions,
    modelLoading,
  };
}
