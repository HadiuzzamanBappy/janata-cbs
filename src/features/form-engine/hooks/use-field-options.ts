import { useMemo } from "react";
import type { FormFieldItem, FormFieldParameter } from "@/lib/data-schemas/form-config-schema";
import type { WidgetOption } from "../types";
import { useModelLookup } from "./use-model-lookup";

export function useFieldOptions(field: FormFieldItem) {
  const param = field.PARAMETER as FormFieldParameter | undefined;
  const { modelOptions, loading: modelLoading } = useModelLookup(param);

  const resolvedOptions: WidgetOption[] = useMemo(() => {
    if (param?.type === "M") {
      return modelOptions;
    }
    if (param?.type === "O" && Array.isArray(param.data) && param.data.length > 0) {
      return param.data.map((d: unknown) => {
        if (typeof d === "string") return { code: d, label: d };
        const dObj = d as Record<string, unknown>;
        const code = dObj.itemCode ?? dObj.code ?? dObj.value ?? dObj.CODE ?? dObj.VALUE ?? "";
        const label = dObj.itemLabel ?? dObj.label ?? dObj.display ?? dObj.LABEL ?? code;
        return {
          code: String(code),
          label: String(label || code),
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
