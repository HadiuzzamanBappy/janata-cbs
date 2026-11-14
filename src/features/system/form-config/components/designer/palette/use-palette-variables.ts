/**
 * @fileoverview Variables query and grouping hook for Form Designer Field Palette.
 * Resolves model property schemas and clusters nested Json object properties.
 *
 * @module features/system/form-config/components/designer/palette/use-palette-variables
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbsQueries } from "@/lib/cbs-client";
import { formatNameToLabel } from "@/lib/core-utils";
import type { ModelProperty } from "@/lib/data-schemas";
import type { PaletteItem, PaletteTypeFilter } from "./palette-types";

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
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [typeFilter, setTypeFilter] = React.useState<PaletteTypeFilter>("all");
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const hasProps = Boolean(propsModelProperties && propsModelProperties.length > 0);
  const cleanTarget = (targetModel || "").split("$")[0].split(",")[0].trim().toUpperCase();

  const { data: fetchedRecord, isLoading: loadingModel } = useQuery({
    ...cbsQueries.modelConfig.record(cleanTarget),
    enabled: !hasProps && Boolean(cleanTarget),
  });

  const modelProperties = React.useMemo(
    () =>
      hasProps ? (propsModelProperties as ModelProperty[]) : (fetchedRecord?.PROPERTIES ?? []),
    [hasProps, propsModelProperties, fetchedRecord],
  );

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
      if (p.TYPE === "Json") {
        const directChildren = Array.isArray(p.PROP) ? p.PROP : [];
        objectMap.set(p.SN, { parent: p, children: [...directChildren] });
        for (const child of directChildren) {
          childSet.add(child.NAME);
        }
      }
    }

    for (const p of modelProperties) {
      if (p.TYPE !== "Json" && p.SN.includes("_")) {
        const parentSn = p.SN.substring(0, p.SN.lastIndexOf("_"));
        const parentEntry = objectMap.get(parentSn);
        if (parentEntry && !parentEntry.children.some((c) => c.SN === p.SN)) {
          parentEntry.children.push(p);
          childSet.add(p.NAME);
        }
      }
    }

    const items: PaletteItem[] = [];
    for (const p of modelProperties) {
      if (p.TYPE === "Json") {
        const grp = objectMap.get(p.SN);
        if (grp) {
          items.push({ kind: "object-group", parent: grp.parent, children: grp.children });
        }
      } else if (!childSet.has(p.NAME)) {
        items.push({ kind: "single", property: p });
      }
    }

    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // 1. Text Search Filter (NAME and LABEL)
      if (query) {
        if (item.kind === "single") {
          const matchName = item.property.NAME.toLowerCase().includes(query);
          const matchLabel = formatNameToLabel(item.property.NAME).toLowerCase().includes(query);
          if (!matchName && !matchLabel) return false;
        } else {
          const matchParent =
            item.parent.NAME.toLowerCase().includes(query) ||
            formatNameToLabel(item.parent.NAME).toLowerCase().includes(query);
          const matchChild = item.children.some(
            (c) =>
              c.NAME.toLowerCase().includes(query) ||
              formatNameToLabel(c.NAME).toLowerCase().includes(query),
          );
          if (!matchParent && !matchChild) return false;
        }
      }

      // 2. Type / Placed Filter
      if (typeFilter === "unplaced") {
        if (item.kind === "single") {
          return !usedFieldNames.has(item.property.NAME);
        }
        return item.children.some((c) => !usedFieldNames.has(c.NAME));
      }

      if (typeFilter === "text") {
        if (item.kind === "single") {
          const t = (item.property.TYPE || "Text").toUpperCase();
          return t.includes("TEXT") || t.includes("CHAR") || t.includes("STRING");
        }
        return true;
      }

      if (typeFilter === "number") {
        if (item.kind === "single") {
          const t = (item.property.TYPE || "").toUpperCase();
          return (
            t.includes("NUM") || t.includes("AMOUNT") || t.includes("INT") || t.includes("DECIMAL")
          );
        }
        return true;
      }

      if (typeFilter === "date") {
        if (item.kind === "single") {
          const t = (item.property.TYPE || "").toUpperCase();
          return t.includes("DATE") || t.includes("TIME");
        }
        return true;
      }

      return true;
    });
  }, [modelProperties, searchQuery, typeFilter, usedFieldNames]);

  return {
    modelProperties,
    loadingModel: hasProps ? false : loadingModel,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    placedCount,
    paletteItems,
    collapsedGroups,
    toggleGroupCollapse,
  };
}
