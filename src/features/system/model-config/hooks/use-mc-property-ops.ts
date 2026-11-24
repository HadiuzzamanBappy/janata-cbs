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
  DEFAULT_PROPERTY_LENGTH,
  type ModelConfigRecord,
  type ModelProperty,
} from "@/lib/data-schemas";

export function useMcPropertyOps(
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>,
) {
  const [committedSnSet, setCommittedSnSet] = React.useState<Set<string>>(new Set());

  const markAsCommitted = React.useCallback((props: ModelProperty[]) => {
    const set = new Set<string>();
    props.forEach((p) => {
      set.add(p.SN);
      p.PROP?.forEach((sub) => {
        set.add(sub.SN);
      });
    });
    setCommittedSnSet(set);
  }, []);

  const addField = React.useCallback((): string => {
    let createdSn = "";
    setFormData((prev) => {
      const props = prev.PROPERTIES || [];
      const maxSn = props.reduce((max, p) => {
        const num = Number.parseInt(p.SN, 10);
        return !Number.isNaN(num) && num > max ? num : max;
      }, 0);
      const nextSn = String(maxSn + 1);
      createdSn = nextSn;
      const newField = createModelProperty(nextSn);
      return {
        ...prev,
        PROPERTIES: [...props, newField],
      };
    });
    return createdSn;
  }, [setFormData]);

  const addSubField = React.useCallback(
    (parentSn: string): string => {
      let createdSn = "";
      setFormData((prev) => {
        const props = (prev.PROPERTIES || []).map((p) => {
          if (p.SN !== parentSn) return p;
          const currentChildren = p.PROP || [];
          // Next after the highest suffix: a count would reuse an SN after a draft delete
          const maxSuffix = currentChildren.reduce((max, sub) => {
            const num = Number.parseInt(sub.SN.split("_").pop() ?? "", 10);
            return !Number.isNaN(num) && num > max ? num : max;
          }, 0);
          const nextSn = `${parentSn}_${maxSuffix + 1}`;
          createdSn = nextSn;
          const newSubField = createModelProperty(nextSn, {
            LENGTH: DEFAULT_PROPERTY_LENGTH,
          });
          // Sub-properties are only offered on Array properties, so the parent type is unchanged
          return { ...p, PROP: [...currentChildren, newSubField] };
        });
        return { ...prev, PROPERTIES: props };
      });
      return createdSn;
    },
    [setFormData],
  );

  const updateField = React.useCallback(
    (sn: string, patch: Partial<ModelProperty>) => {
      // Invariant: Committed properties cannot change NAME, TYPE, or STRUCTURE
      const isCommitted = committedSnSet.has(sn);
      const safePatch = isCommitted
        ? Object.fromEntries(
            Object.entries(patch).filter(
              ([k]) => k !== "NAME" && k !== "TYPE" && k !== "STRUCTURE",
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
    [committedSnSet, setFormData],
  );

  const isFieldCommitted = React.useCallback(
    (sn: string) => committedSnSet.has(sn),
    [committedSnSet],
  );

  const removeDraftField = React.useCallback(
    (sn: string) => {
      setFormData((prev) => {
        // Core Banking Rule: Committed properties in database cannot be deleted (append-only schema evolution)
        if (committedSnSet.has(sn)) {
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
    [committedSnSet, setFormData],
  );

  const clearCommitted = React.useCallback(() => {
    setCommittedSnSet(new Set());
  }, []);

  return {
    addField,
    addSubField,
    updateField,
    removeField: removeDraftField,
    isFieldCommitted,
    markAsCommitted,
    clearCommitted,
  };
}
