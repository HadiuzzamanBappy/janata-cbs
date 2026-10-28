import { useEffect, useState } from "react";
import { cbs } from "@/lib/cbs-client";
import type { FormFieldParameter } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { WidgetOption } from "../types";

/**
 * Hook to resolve dynamic CBS model lookup options when parameter.type === 'M'
 */
export function useModelLookup(param: FormFieldParameter | undefined) {
  const [modelOptions, setModelOptions] = useState<WidgetOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (param?.type !== "M" || !param.modelName) {
      setModelOptions([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    cbs
      .send<ModelConfigRecord>(cbs.modelConfig.get(param.modelName), { silent: true })
      .then((res) => {
        if (!isMounted) return;
        const rawProps: ModelProperty[] = res.data?.PROPERTIES || [];
        const opts = rawProps
          .map((p) => {
            const pObj = p as unknown as Record<string, unknown>;
            const codeVal = param.reference
              ? (pObj[param.reference] ?? pObj[param.reference.toUpperCase()])
              : p.NAME || p.SN;
            const labelVal = param.displayField
              ? (pObj[param.displayField] ?? pObj[param.displayField.toUpperCase()])
              : p.LABEL || p.NAME;
            return {
              code: String(codeVal ?? ""),
              label: String(labelVal ?? codeVal ?? ""),
            };
          })
          .filter((o) => Boolean(o.code));
        setModelOptions(opts);
      })
      .catch(() => {
        if (isMounted) setModelOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [param?.type, param?.modelName, param?.reference, param?.displayField]);

  return { modelOptions, loading };
}
