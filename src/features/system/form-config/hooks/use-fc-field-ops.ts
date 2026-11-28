/**
 * @fileoverview Field manipulation operations hook for Form Designer.
 * Coordinates field addition, updating, deletion, and cross-section movement.
 *
 * @module features/system/form-config/hooks/use-fc-field-ops
 */

"use client";

import * as React from "react";
import type { FormConfigRecord, FormElement, FormSection } from "@/lib/data-schemas";
import { createDesignerField, updateFieldDeep } from "./fc-field-tree";
import { useFcFieldMovement } from "./use-fc-field-movement";

/** @param readSections the latest sections, for fields made before an update (see useFcSectionOps) */
export function useFcFieldOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedFieldId: (id: string | null) => void,
  setSelectedSectionId: (id: string | null) => void,
  readSections: () => FormSection[],
) {
  const movement = useFcFieldMovement(
    setFormData,
    setSelectedFieldId,
    setSelectedSectionId,
    readSections,
  );

  const addFieldToSection = React.useCallback(
    (sectionId: string, fieldTemplate?: Partial<FormElement>, insertIndex?: number) => {
      // Built before the update so the updater stays pure, and so it can be selected after
      const newField = createDesignerField(fieldTemplate ?? {}, readSections());
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        const updatedSections = sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const currentFields = [...(sec.fields || [])];
          if (
            typeof insertIndex === "number" &&
            insertIndex >= 0 &&
            insertIndex <= currentFields.length
          ) {
            currentFields.splice(insertIndex, 0, newField);
          } else {
            currentFields.push(newField);
          }
          return { ...sec, fields: currentFields };
        });

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: updatedSections,
          },
        };
      });
      // Fields are found by SN first (fc-field-tree)
      setSelectedFieldId(newField.SN);
    },
    [readSections, setFormData, setSelectedFieldId],
  );

  const updateField = React.useCallback(
    (fieldId: string, patch: Partial<FormElement>) => {
      // Reaches inner fields of object groups too (fc-field-tree)
      setFormData((prev) => ({
        ...prev,
        frmElements: {
          ...prev.frmElements,
          sections: updateFieldDeep(prev.frmElements?.sections || [], fieldId, (f) => ({
            ...f,
            ...patch,
          })),
        },
      }));
    },
    [setFormData],
  );

  const removeField = React.useCallback(
    (fieldId: string) => {
      setFormData((prev) => {
        const updatedSections = updateFieldDeep(
          prev.frmElements?.sections || [],
          fieldId,
          () => null,
        );

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: updatedSections,
          },
        };
      });

      setSelectedFieldId(null);
    },
    [setFormData, setSelectedFieldId],
  );

  return {
    addFieldToSection,
    updateField,
    removeField,
    reorderFields: movement.reorderFields,
    moveFieldAcrossSections: movement.moveFieldAcrossSections,
  };
}
