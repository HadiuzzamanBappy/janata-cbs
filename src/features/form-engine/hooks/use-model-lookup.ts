import { useEffect, useState } from "react";
import { cbs } from "@/lib/cbs-client";
import type {
  FormFieldParameter,
  ModelConfigRecord,
  ModelProperty,
} from "@/lib/data-schemas/model-config-schema";
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

    const modelName = param.modelName.trim();

    // 1. First attempt to fetch live data records (e.g. BRANCH or SC_LOOKUP rows)
    cbs
      .send<unknown[] | { items?: unknown[] }>(cbs.model(modelName).list(), { silent: true })
      .then((res) => {
        if (!isMounted) return;
        const resData = res.data;
        const rawList: unknown[] = Array.isArray(resData)
          ? resData
          : Array.isArray((resData as { items?: unknown[] })?.items)
            ? ((resData as { items: unknown[] }).items ?? [])
            : [];

        if (rawList.length > 0) {
          let filtered = rawList;

          // Apply condition filter (e.g. category == 'MARITAL_STATUS')
          if (param.condition) {
            const cond = param.condition.trim();
            const match = cond.match(/^(\w+)\s*(===|==)\s*['"]([^'"]+)['"]$/i);
            if (match) {
              const [, fieldKey, , expectedVal] = match;
              filtered = rawList.filter((item) => {
                const rec = item as Record<string, unknown>;
                const actual =
                  rec[fieldKey] ?? rec[fieldKey.toLowerCase()] ?? rec[fieldKey.toUpperCase()];
                return String(actual ?? "").toLowerCase() === expectedVal.toLowerCase();
              });
            }
          }

          const codeKey = param.codeField || param.reference || "id";
          const displayKey = param.displayField || "description";

          const opts: WidgetOption[] = filtered
            .map((item) => {
              const rec = item as Record<string, unknown>;
              const codeVal =
                rec[codeKey] ??
                rec[codeKey.toLowerCase()] ??
                rec.id ??
                rec.recordId ??
                rec.code ??
                "";
              const labelVal =
                rec[displayKey] ??
                rec[displayKey.toLowerCase()] ??
                rec.name ??
                rec.title ??
                rec.description ??
                codeVal;
              return {
                code: String(codeVal),
                label: String(labelVal || codeVal),
              };
            })
            .filter((o) => Boolean(o.code));

          setModelOptions(opts);
          return;
        }

        // 2. Fallback: If no records, try fetching metamodel properties (for designer column pickers)
        return cbs
          .send<ModelConfigRecord>(cbs.modelConfig.get(modelName), { silent: true })
          .then((metaRes) => {
            if (!isMounted) return;
            const rawProps: ModelProperty[] = metaRes.data?.PROPERTIES || [];
            const opts: WidgetOption[] = rawProps
              .map((p) => {
                const codeVal = p.NAME || p.SN;
                const labelVal = p.LABEL || p.NAME;
                return {
                  code: String(codeVal ?? ""),
                  label: String(labelVal ?? codeVal ?? ""),
                };
              })
              .filter((o) => Boolean(o.code));
            setModelOptions(opts);
          });
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
  }, [
    param?.type,
    param?.modelName,
    param?.reference,
    param?.codeField,
    param?.displayField,
    param?.condition,
  ]);

  return { modelOptions, loading };
}
