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
import type { FormSection, ModelProperty } from "@/lib/data-schemas";
import { CBS_PROPERTY_TYPE } from "@/lib/data-schemas";
import type { PaletteItem, PaletteTypeFilter } from "./palette-types";

export interface UsePaletteVariablesOptions {
  targetModel?: string;
  propsModelProperties?: ModelProperty[];
  usedFieldNames: Set<string>;
  sections?: FormSection[];
}

export function usePaletteVariables({
  targetModel,
  propsModelProperties,
  usedFieldNames,
  sections,
}: UsePaletteVariablesOptions) {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [typeFilter, setTypeFilter] = React.useState<PaletteTypeFilter>("all");
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const hasProps = Boolean(propsModelProperties && propsModelProperties.length > 0);
  // The query strips version suffixes itself and stays off for an empty ID
  const modelQuery = cbsQueries.modelConfig.record(targetModel || "");
  const { data: fetchedRecord, isLoading: loadingModel } = useQuery({
    ...modelQuery,
    enabled: !hasProps && modelQuery.enabled,
  });

  const modelProperties = React.useMemo(
    () =>
      hasProps ? (propsModelProperties as ModelProperty[]) : (fetchedRecord?.PROPERTIES ?? []),
    [hasProps, propsModelProperties, fetchedRecord],
  );

  const placedInnerNamesByParent = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const sec of sections ?? []) {
      for (const f of sec.fields ?? []) {
        if (f.TYPE === CBS_PROPERTY_TYPE.ARRAY) {
          map.set(f.NAME, new Set((f.PROP ?? []).map((p) => p.NAME)));
        }
      }
    }
    return map;
  }, [sections]);

  const toggleGroupCollapse = (sn: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [sn]: !prev[sn] }));
  };

  const allItems: PaletteItem[] = React.useMemo(() => {
    const objectMap = new Map<string, { parent: ModelProperty; children: ModelProperty[] }>();
    const childSet = new Set<string>();

    for (const p of modelProperties) {
      if (p.TYPE === CBS_PROPERTY_TYPE.ARRAY) {
        const directChildren = Array.isArray(p.PROP) ? p.PROP : [];
        objectMap.set(p.SN, { parent: p, children: [...directChildren] });
        for (const child of directChildren) {
          childSet.add(child.NAME);
        }
      }
    }

    for (const p of modelProperties) {
      if (p.TYPE !== CBS_PROPERTY_TYPE.ARRAY && p.SN.includes("_")) {
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
      if (p.TYPE === CBS_PROPERTY_TYPE.ARRAY) {
        const grp = objectMap.get(p.SN);
        if (grp) {
          items.push({ kind: "object-group", parent: grp.parent, children: grp.children });
        }
      } else if (!childSet.has(p.NAME)) {
        items.push({ kind: "single", property: p });
      }
    }
    return items;
  }, [modelProperties]);

  const isItemPlaced = React.useCallback(
    (item: PaletteItem) =>
      usedFieldNames.has(item.kind === "single" ? item.property.NAME : item.parent.NAME),
    [usedFieldNames],
  );

  const isItemUnplaced = React.useCallback(
    (item: PaletteItem) => {
      if (item.kind === "single") {
        return !usedFieldNames.has(item.property.NAME);
      }
      if (!usedFieldNames.has(item.parent.NAME)) return true;
      const placedInner = placedInnerNamesByParent.get(item.parent.NAME);
      return placedInner ? item.children.some((c) => !placedInner.has(c.NAME)) : false;
    },
    [usedFieldNames, placedInnerNamesByParent],
  );

  const totalCount = allItems.length;
  const placedCount = React.useMemo(
    () => allItems.filter(isItemPlaced).length,
    [allItems, isItemPlaced],
  );
  const unplacedCount = React.useMemo(
    () => allItems.filter(isItemUnplaced).length,
    [allItems, isItemUnplaced],
  );

  const paletteItems: PaletteItem[] = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allItems.filter((item) => {
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

      // 2. Placed Status Filter
      if (typeFilter === "placed") return isItemPlaced(item);
      if (typeFilter === "unplaced") return isItemUnplaced(item);

      return true;
    });
  }, [allItems, searchQuery, typeFilter, isItemPlaced, isItemUnplaced]);

  return {
    modelProperties,
    loadingModel: hasProps ? false : loadingModel,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    totalCount,
    placedCount,
    unplacedCount,
    paletteItems,
    collapsedGroups,
    toggleGroupCollapse,
  };
}
