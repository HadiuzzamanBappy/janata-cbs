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
      return param.data.map((d: unknown) => {
        if (typeof d === "string") return { code: d, label: d };
        const dObj = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
        const code = String(dObj.code ?? dObj.value ?? dObj.itemCode ?? dObj.name ?? "");
        const label = String(dObj.label ?? dObj.itemLabel ?? dObj.name ?? dObj.value ?? code);
        return {
          code,
          label: label || code,
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
