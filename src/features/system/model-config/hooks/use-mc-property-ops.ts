"use client";

import * as React from "react";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

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
      const newField: ModelProperty = {
        SN: nextSn,
        NAME: "",
        LABEL: "",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: false,
      };
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
          const nextSubIndex = currentChildren.length + 1;
          const nextSn = `${parentSn}_${nextSubIndex}`;
          createdSn = nextSn;
          const newSubField: ModelProperty = {
            SN: nextSn,
            NAME: "",
            LABEL: "",
            TYPE: "Text",
            STRUCTURE: "S",
            LENGTH: 35,
            REQUIRED: false,
          };
          return {
            ...p,
            TYPE: "Object" as const,
            PROP: [...currentChildren, newSubField],
          };
        });
        return { ...prev, PROPERTIES: props };
      });
      return createdSn;
    },
    [setFormData],
  );

  const updateField = React.useCallback(
    (sn: string, patch: Partial<ModelProperty>) => {
      setFormData((prev) => {
        const updated = (prev.PROPERTIES || []).map((p) => {
          if (p.SN === sn) {
            return { ...p, ...patch };
          }
          if (p.PROP?.some((sub) => sub.SN === sn)) {
            return {
              ...p,
              PROP: p.PROP.map((sub) => (sub.SN === sn ? { ...sub, ...patch } : sub)),
            };
          }
          return p;
        });
        return { ...prev, PROPERTIES: updated };
      });
    },
    [setFormData],
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

  const moveField = React.useCallback(
    (sn: string, direction: "up" | "down") => {
      setFormData((prev) => {
        const props = [...(prev.PROPERTIES || [])];
        const index = props.findIndex((p) => p.SN === sn);
        if (index === -1) return prev;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= props.length) return prev;

        const temp = props[index];
        props[index] = props[targetIndex];
        props[targetIndex] = temp;

        return {
          ...prev,
          PROPERTIES: props,
        };
      });
    },
    [setFormData],
  );

  return {
    addField,
    addSubField,
    updateField,
    moveField,
    removeField: removeDraftField,

    isFieldCommitted,
    markAsCommitted,
    clearCommitted: () => setCommittedSnSet(new Set()),
  };
}
