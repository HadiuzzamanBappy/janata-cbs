"use client";

import * as React from "react";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export function useMcTreeOps(setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>) {
  const [committedSnSet, setCommittedSnSet] = React.useState<Set<string>>(new Set());

  const markAsCommitted = React.useCallback((props: ModelProperty[]) => {
    setCommittedSnSet(new Set(props.map((p) => p.sn)));
  }, []);

  const addField = React.useCallback((): string => {
    let createdSn = "";
    setFormData((prev) => {
      const maxSn = prev.properties.reduce((max, p) => {
        if (p.sn.includes("_")) return max;
        const num = Number.parseInt(p.sn, 10);
        return !Number.isNaN(num) && num > max ? num : max;
      }, 0);
      const nextSn = String(maxSn + 1);
      createdSn = nextSn;
      const newField: ModelProperty = {
        sn: nextSn,
        name: "",
        label: "",
        type: "Text",
        structure: "S",
        length: 50,
        required: false,
        disabled: false,
        status: "ACTIVE",
      };
      return {
        ...prev,
        properties: [...prev.properties, newField],
      };
    });
    return createdSn;
  }, [setFormData]);

  const addChildField = React.useCallback(
    (parentSN: string): string => {
      let createdSn = "";
      setFormData((prev) => {
        const parentIndex = prev.properties.findIndex((p) => p.sn === parentSN);
        if (parentIndex === -1) return prev;

        const prefix = `${parentSN}_`;
        const directChildren = prev.properties.filter((p) => {
          if (!p.sn.startsWith(prefix)) return false;
          const remainder = p.sn.slice(prefix.length);
          return !remainder.includes("_");
        });

        const maxChildNum = directChildren.reduce((max, p) => {
          const num = Number.parseInt(p.sn.slice(prefix.length), 10);
          return !Number.isNaN(num) && num > max ? num : max;
        }, 0);

        const nextChildSn = `${parentSN}_${maxChildNum + 1}`;
        createdSn = nextChildSn;

        const newChild: ModelProperty = {
          sn: nextChildSn,
          name: "",
          label: "",
          type: "Text",
          structure: "S",
          length: 50,
          required: false,
          disabled: false,
          status: "ACTIVE",
        };

        let insertIndex = parentIndex;
        for (let i = parentIndex + 1; i < prev.properties.length; i++) {
          if (prev.properties[i].sn.startsWith(prefix)) {
            insertIndex = i;
          } else {
            break;
          }
        }

        const nextProperties = [...prev.properties];
        nextProperties.splice(insertIndex + 1, 0, newChild);

        return {
          ...prev,
          properties: nextProperties,
        };
      });
      return createdSn;
    },
    [setFormData],
  );

  const updateField = React.useCallback(
    (sn: string, patch: Partial<ModelProperty>) => {
      setFormData((prev) => ({
        ...prev,
        properties: prev.properties.map((p) => (p.sn === sn ? { ...p, ...patch } : p)),
      }));
    },
    [setFormData],
  );

  const isFieldCommitted = React.useCallback(
    (sn: string) => committedSnSet.has(sn),
    [committedSnSet],
  );

  const deprecateOrRemoveField = React.useCallback(
    (sn: string, forceHardDelete = false) => {
      setFormData((prev) => {
        const isCommitted = committedSnSet.has(sn);
        const prefix = `${sn}_`;
        if (!isCommitted || forceHardDelete) {
          return {
            ...prev,
            properties: prev.properties.filter((p) => p.sn !== sn && !p.sn.startsWith(prefix)),
          };
        }
        return {
          ...prev,
          properties: prev.properties.map((p) => {
            if (p.sn === sn || p.sn.startsWith(prefix)) {
              return {
                ...p,
                status: p.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED",
                disabled: p.status !== "ARCHIVED",
              };
            }
            return p;
          }),
        };
      });
    },
    [committedSnSet, setFormData],
  );

  return {
    addField,
    addChildField,
    updateField,
    removeField: deprecateOrRemoveField,
    deprecateOrRemoveField,
    isFieldCommitted,
    markAsCommitted,
    clearCommitted: () => setCommittedSnSet(new Set()),
  };
}
