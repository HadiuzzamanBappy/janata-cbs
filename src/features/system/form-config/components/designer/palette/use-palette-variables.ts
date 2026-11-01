import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { PaletteItem } from "./palette-types";

export interface UsePaletteVariablesOptions {
  targetModel?: string;
  propsModelProperties?: ModelProperty[];
  usedFieldNames: Set<string>;
}

export function usePaletteVariables({
  targetModel,
  propsModelProperties,
  usedFieldNames,
}: UsePaletteVariablesOptions) {
  const [fetchedProperties, setFetchedProperties] = React.useState<ModelProperty[]>([]);
  const [loadingModel, setLoadingModel] = React.useState<boolean>(false);
  const [modelFilter, setModelFilter] = React.useState<"all" | "unplaced">("all");
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const modelProperties =
    propsModelProperties && propsModelProperties.length > 0
      ? propsModelProperties
      : fetchedProperties;

  React.useEffect(() => {
    if ((propsModelProperties && propsModelProperties.length > 0) || !targetModel) {
      setFetchedProperties([]);
      return;
    }

    let isMounted = true;
    setLoadingModel(true);

    cbs
      .send<ModelConfigRecord>(cbs.modelConfig.get(targetModel))
      .then((res) => {
        if (isMounted && res.data?.PROPERTIES) {
          setFetchedProperties(res.data.PROPERTIES);
        }
      })
      .catch(() => {
        if (isMounted) setFetchedProperties([]);
      })
      .finally(() => {
        if (isMounted) setLoadingModel(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetModel, propsModelProperties]);

  const placedCount = React.useMemo(() => {
    return modelProperties.filter((p) => usedFieldNames.has(p.NAME)).length;
  }, [modelProperties, usedFieldNames]);

  const toggleGroupCollapse = (sn: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [sn]: !prev[sn] }));
  };

  const paletteItems: PaletteItem[] = React.useMemo(() => {
    const objectMap = new Map<string, { parent: ModelProperty; children: ModelProperty[] }>();
    const childSet = new Set<string>();

    for (const p of modelProperties) {
      if ((p.TYPE as string) === "Object") {
        objectMap.set(p.SN, { parent: p, children: [] });
      }
    }

    for (const p of modelProperties) {
      if ((p.TYPE as string) !== "Object" && p.SN.includes("_")) {
        const parentSn = p.SN.substring(0, p.SN.lastIndexOf("_"));
        const parentEntry = objectMap.get(parentSn);
        if (parentEntry) {
          parentEntry.children.push(p);
          childSet.add(p.NAME);
        }
      }
    }

    const items: PaletteItem[] = [];
    for (const p of modelProperties) {
      if ((p.TYPE as string) === "Object") {
        const grp = objectMap.get(p.SN);
        if (grp) {
          items.push({ kind: "object-group", parent: grp.parent, children: grp.children });
        }
      } else if (!childSet.has(p.NAME)) {
        items.push({ kind: "single", property: p });
      }
    }

    if (modelFilter === "unplaced") {
      return items.filter((item) => {
        if (item.kind === "single") {
          return !usedFieldNames.has(item.property.NAME);
        }
        return item.children.some((c) => !usedFieldNames.has(c.NAME));
      });
    }

    return items;
  }, [modelProperties, modelFilter, usedFieldNames]);

  return {
    modelProperties,
    loadingModel,
    modelFilter,
    setModelFilter,
    placedCount,
    paletteItems,
    collapsedGroups,
    toggleGroupCollapse,
  };
}
