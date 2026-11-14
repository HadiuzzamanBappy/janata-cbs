import { useMemo } from "react";
import type { FormElement, FormFieldParameter } from "@/lib/data-schemas/form-engine-schema";
import type { WidgetOption } from "../types";
import { useModelLookup } from "./use-model-lookup";

export function useFieldOptions(field: FormElement) {
  const param = field.PARAMETER as FormFieldParameter | undefined;
  const { modelOptions, loading: modelLoading } = useModelLookup(param);

  const resolvedOptions: WidgetOption[] = useMemo(() => {
    const pType = param?.type;
    const pData = param?.data;
    if (pType === "M") {
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
