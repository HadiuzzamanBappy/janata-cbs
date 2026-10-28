"use client";

import * as React from "react";
import type {
  INQSelectField,
  InquiryConfigRecord,
} from "@/lib/data-schemas/inquiry-config-schema";

export function useIcFilterOps(
  setFormData: React.Dispatch<React.SetStateAction<InquiryConfigRecord>>,
) {
  const addFilter = React.useCallback(
    (field?: Partial<INQSelectField>) => {
      setFormData((prev) => {
        const currentFilters = prev.INQSelectField || [];
        const newFilter: INQSelectField = {
          selectFieldName: field?.selectFieldName || `field_${currentFilters.length + 1}`,
          selectFieldDisplay: field?.selectFieldDisplay || `Field ${currentFilters.length + 1}`,
          selectFieldType: field?.selectFieldType || "text",
          selectFieldOperator: field?.selectFieldOperator || "EQ",
          selectFieldOperatorFixed: field?.selectFieldOperatorFixed || "",
          selectFieldValue: field?.selectFieldValue || "",
          selectFieldRequired: field?.selectFieldRequired || false,
        };
        return {
          ...prev,
          INQSelectField: [...currentFilters, newFilter],
        };
      });
    },
    [setFormData],
  );

  const updateFilter = React.useCallback(
    (index: number, patch: Partial<INQSelectField>) => {
      setFormData((prev) => {
        const nextFilters = [...(prev.INQSelectField || [])];
        if (nextFilters[index]) {
          nextFilters[index] = { ...nextFilters[index], ...patch };
        }
        return {
          ...prev,
          INQSelectField: nextFilters,
        };
      });
    },
    [setFormData],
  );

  const removeFilter = React.useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        INQSelectField: (prev.INQSelectField || []).filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  const reorderFilters = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      setFormData((prev) => {
        const items = [...(prev.INQSelectField || [])];
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
        return {
          ...prev,
          INQSelectField: items,
        };
      });
    },
    [setFormData],
  );

  return {
    addFilter,
    updateFilter,
    removeFilter,
    reorderFilters,
  };
}

