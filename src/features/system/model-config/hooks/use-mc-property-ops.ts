/**
 * @fileoverview Property operations hook for MODEL.CONFIG property trees.
 * Manages adding, updating, subfield nesting, and append-only immutability
 * constraints for committed physical database properties.
 *
 * @module features/system/model-config/hooks/use-mc-property-ops
 */

"use client";

import * as React from "react";
import {
  createModelProperty,
  type ModelConfigRecord,
  type ModelProperty,
} from "@/lib/data-schemas";

/** Keys a committed (saved) column can never change: the stored data depends on them. */
export const COMMITTED_LOCKED_KEYS: ReadonlySet<string> = new Set([
  "NAME",
  "TYPE",
  "STRUCTURE",
  "MODELNAME",
]);

/** The committed copy of a column by SN, or undefined for a draft column. */
export type CommittedPropertyLookup = (sn: string) => ModelProperty | undefined;

/** Highest numeric SN suffix (after the last `_`) in a list, so a deleted draft SN is never reused. */
function maxSnSuffix(props: readonly ModelProperty[]): number {
  return props.reduce((max, p) => {
    const num = Number.parseInt(p.SN.split("_").pop() ?? "", 10);
    return !Number.isNaN(num) && num > max ? num : max;
  }, 0);
}

/**
 * @param savedProperties the columns of the record the screen loaded (none for a new draft): the
 *   one source of what is committed, so it can't fall out of step with the loaded record.
 */
export function useMcPropertyOps(
  properties: readonly ModelProperty[],
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>,
  savedProperties: readonly ModelProperty[] | undefined,
) {
  // Committed columns and sub-columns by SN
  const committed = React.useMemo(() => {
    const map = new Map<string, ModelProperty>();
    for (const p of savedProperties ?? []) {
      map.set(p.SN, p);
      for (const sub of p.PROP ?? []) map.set(sub.SN, sub);
    }
    return map;
  }, [savedProperties]);

  // The latest columns, plus any added since the last render, so two quick adds get distinct SNs
  const propertiesRef = React.useRef(properties);
  React.useLayoutEffect(() => {
    propertiesRef.current = properties;
  }, [properties]);

  const addField = React.useCallback((): string => {
    const newField = createModelProperty(String(maxSnSuffix(propertiesRef.current) + 1));
    propertiesRef.current = [...propertiesRef.current, newField];
    setFormData((prev) => ({ ...prev, PROPERTIES: [...(prev.PROPERTIES || []), newField] }));
    return newField.SN;
  }, [setFormData]);

  const addSubField = React.useCallback(
    (parentSn: string): string => {
      const parent = propertiesRef.current.find((p) => p.SN === parentSn);
      if (!parent) return "";
      // Sub-properties are only offered on Array properties, so the parent type is unchanged
      const newSub = createModelProperty(`${parentSn}_${maxSnSuffix(parent.PROP ?? []) + 1}`);
      const withSub = (p: ModelProperty) =>
        p.SN === parentSn ? { ...p, PROP: [...(p.PROP || []), newSub] } : p;
      propertiesRef.current = propertiesRef.current.map(withSub);
      setFormData((prev) => ({ ...prev, PROPERTIES: (prev.PROPERTIES || []).map(withSub) }));
      return newSub.SN;
    },
    [setFormData],
  );

  const updateField = React.useCallback(
    (sn: string, patch: Partial<ModelProperty>) => {
      // A committed column keeps its locked keys, and an optional one never becomes required
      // (existing rows may hold nulls). A shorter LENGTH is reported by validation instead,
      // so typing a longer value digit by digit isn't blocked.
      const saved = committed.get(sn);
      const safePatch = saved
        ? Object.fromEntries(
            Object.entries(patch).filter(
              ([k, v]) =>
                !COMMITTED_LOCKED_KEYS.has(k) && !(k === "REQUIRED" && v && !saved.REQUIRED),
            ),
          )
        : patch;

      setFormData((prev) => {
        const updated = (prev.PROPERTIES || []).map((p) => {
          if (p.SN === sn) {
            return { ...p, ...safePatch };
          }
          if (p.PROP?.some((sub) => sub.SN === sn)) {
            return {
              ...p,
              PROP: p.PROP.map((sub) => (sub.SN === sn ? { ...sub, ...safePatch } : sub)),
            };
          }
          return p;
        });
        return { ...prev, PROPERTIES: updated };
      });
    },
    [committed, setFormData],
  );

  const committedProperty = React.useCallback<CommittedPropertyLookup>(
    (sn) => committed.get(sn),
    [committed],
  );

  const removeDraftField = React.useCallback(
    (sn: string) => {
      setFormData((prev) => {
        // Core Banking Rule: Committed properties in database cannot be deleted (append-only schema evolution)
        if (committed.has(sn)) {
          return prev;
        }

        const filtered = (prev.PROPERTIES || [])
          .filter((p) => p.SN !== sn)
          .map((p) => {
            if (p.PROP?.some((sub) => sub.SN === sn)) {
              return {
                ...p,
                PROP: p.PROP.filter((sub) => sub.SN !== sn),
              };
            }
            return p;
          });

        return {
          ...prev,
          PROPERTIES: filtered,
        };
      });
    },
    [committed, setFormData],
  );

  return {
    addField,
    addSubField,
    updateField,
    removeField: removeDraftField,
    committedProperty,
  };
}
