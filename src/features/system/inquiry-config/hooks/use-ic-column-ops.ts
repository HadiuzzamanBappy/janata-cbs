"use client";

import * as React from "react";
import type {
  INQDef,
  InquiryConfigRecord,
} from "@/lib/data-schemas/inquiry-config-schema";

export function useIcColumnOps(
  setFormData: React.Dispatch<React.SetStateAction<InquiryConfigRecord>>,
) {
  const addColumn = React.useCallback(
    (col?: Partial<INQDef>) => {
      setFormData((prev) => {
        const currentCols = prev.INQDef || [];
        const nextOrder = currentCols.length + 1;
        const newCol: INQDef = {
          fieldName: col?.fieldName || `col_${nextOrder}`,
          fieldDisplay: col?.fieldDisplay || `Column ${nextOrder}`,
          fieldType: col?.fieldType || "CH",
          fieldLength: col?.fieldLength || "20,L",
          fieldRowCol: col?.fieldRowCol || `1,${nextOrder}`,
          fieldFunc: col?.fieldFunc || "",
          dataPassable: col?.dataPassable ?? null,
        };
        return {
          ...prev,
          INQDef: [...currentCols, newCol],
        };
      });
    },
    [setFormData],
  );

  const updateColumn = React.useCallback(
    (index: number, patch: Partial<INQDef>) => {
      setFormData((prev) => {
        const nextCols = [...(prev.INQDef || [])];
        if (nextCols[index]) {
          nextCols[index] = { ...nextCols[index], ...patch };
        }
        return {
          ...prev,
          INQDef: nextCols,
        };
      });
    },
    [setFormData],
  );

  const removeColumn = React.useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        INQDef: (prev.INQDef || []).filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  const reorderColumns = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      setFormData((prev) => {
        const items = [...(prev.INQDef || [])];
        if (
          fromIndex < 0 ||
          fromIndex >= items.length ||
          toIndex < 0 ||
          toIndex >= items.length
        ) {
          return prev;
        }
        const [moved] = items.splice(fromIndex, 1);
        if (moved) {
          items.splice(toIndex, 0, moved);
        }

        // Renumber fieldRowCol col position
        const reindexed = items.map((col, idx) => {
          const rowPart = col.fieldRowCol?.split(",")[0] || "1";
          return {
            ...col,
            fieldRowCol: `${rowPart},${idx + 1}`,
          };
        });

        return {
          ...prev,
          INQDef: reindexed,
        };
      });
    },
    [setFormData],
  );

  return {
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
  };
}

