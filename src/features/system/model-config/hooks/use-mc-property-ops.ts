"use client";

import * as React from "react";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export function useMcPropertyOps(
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>,
) {
  const [committedSnSet, setCommittedSnSet] = React.useState<Set<string>>(new Set());

  const markAsCommitted = React.useCallback((props: ModelProperty[]) => {
    setCommittedSnSet(new Set(props.map((p) => p.SN)));
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
        WIDTH: "md",
      };
      return {
        ...prev,
        PROPERTIES: [...props, newField],
      };
    });
    return createdSn;
  }, [setFormData]);

  const updateField = React.useCallback(
    (sn: string, patch: Partial<ModelProperty>) => {
      setFormData((prev) => ({
        ...prev,
        PROPERTIES: (prev.PROPERTIES || []).map((p) => (p.SN === sn ? { ...p, ...patch } : p)),
      }));
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

        return {
          ...prev,
          PROPERTIES: (prev.PROPERTIES || []).filter((p) => p.SN !== sn),
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
    updateField,
    moveField,
    removeField: removeDraftField,

    isFieldCommitted,
    markAsCommitted,
    clearCommitted: () => setCommittedSnSet(new Set()),
  };
}
