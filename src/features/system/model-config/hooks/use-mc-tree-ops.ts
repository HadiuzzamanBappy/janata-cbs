"use client";

import * as React from "react";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export function useMcTreeOps(setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>) {
  const [committedSnSet, setCommittedSnSet] = React.useState<Set<string>>(new Set());

  const markAsCommitted = React.useCallback((props: ModelProperty[]) => {
    const snList: string[] = [];
    const walk = (items: ModelProperty[]) => {
      for (const p of items) {
        snList.push(p.SN);
        if (p.PROP && p.PROP.length > 0) walk(p.PROP);
      }
    };
    walk(props);
    setCommittedSnSet(new Set(snList));
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
        DISABLED: false,
        STATUS: "ACTIVE",
        PROP: [],
      };
      return {
        ...prev,
        PROPERTIES: [...props, newField],
      };
    });
    return createdSn;
  }, [setFormData]);

  const addChildField = React.useCallback(
    (parentSN: string): string => {
      let createdSn = "";
      setFormData((prev) => {
        const props = prev.PROPERTIES || [];

        const appendChild = (items: ModelProperty[]): ModelProperty[] => {
          return items.map((p) => {
            if (p.SN === parentSN) {
              const children = p.PROP || [];
              const maxChildNum = children.reduce((max, c) => {
                const parts = c.SN.split("_");
                const lastNum = Number.parseInt(parts[parts.length - 1], 10);
                return !Number.isNaN(lastNum) && lastNum > max ? lastNum : max;
              }, 0);
              const nextChildSn = `${parentSN}_${maxChildNum + 1}`;
              createdSn = nextChildSn;
              const newChild: ModelProperty = {
                SN: nextChildSn,
                NAME: "",
                LABEL: "",
                TYPE: "Text",
                STRUCTURE: "S",
                LENGTH: 50,
                REQUIRED: false,
                DISABLED: false,
                STATUS: "ACTIVE",
                PROP: [],
              };
              return {
                ...p,
                PROP: [...children, newChild],
              };
            }
            if (p.PROP && p.PROP.length > 0) {
              return {
                ...p,
                PROP: appendChild(p.PROP),
              };
            }
            return p;
          });
        };

        return {
          ...prev,
          PROPERTIES: appendChild(props),
        };
      });
      return createdSn;
    },
    [setFormData],
  );

  const updateField = React.useCallback(
    (sn: string, patch: Partial<ModelProperty>) => {
      setFormData((prev) => {
        const updateRecursive = (items: ModelProperty[]): ModelProperty[] => {
          return items.map((p) => {
            if (p.SN === sn) {
              return { ...p, ...patch };
            }
            if (p.PROP && p.PROP.length > 0) {
              return { ...p, PROP: updateRecursive(p.PROP) };
            }
            return p;
          });
        };
        return {
          ...prev,
          PROPERTIES: updateRecursive(prev.PROPERTIES || []),
        };
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

        const removeRecursive = (items: ModelProperty[]): ModelProperty[] => {
          return items
            .filter((p) => p.SN !== sn)
            .map((p) => {
              if (p.PROP && p.PROP.length > 0) {
                return { ...p, PROP: removeRecursive(p.PROP) };
              }
              return p;
            });
        };

        return {
          ...prev,
          PROPERTIES: removeRecursive(prev.PROPERTIES || []),
        };
      });
    },
    [committedSnSet, setFormData],
  );

  return {
    addField,
    addChildField,
    updateField,
    removeField: removeDraftField,
    isFieldCommitted,
    markAsCommitted,
    clearCommitted: () => setCommittedSnSet(new Set()),
  };
}
