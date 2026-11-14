/**
 * @fileoverview Field manipulation operations hook for Form Designer.
 * Coordinates field addition, updating, deletion, and cross-section movement.
 *
 * @module features/system/form-config/hooks/use-fc-field-ops
 */

"use client";

import * as React from "react";
import type { FormConfigRecord, FormElement } from "@/lib/data-schemas";
import { isMatchingField, useFcFieldMovement } from "./use-fc-field-movement";

export function useFcFieldOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedFieldId: (id: string | null) => void,
  setSelectedSectionId?: (id: string | null) => void,
) {
  const movement = useFcFieldMovement(setFormData, setSelectedFieldId, setSelectedSectionId);

  const addFieldToSection = React.useCallback(
    (sectionId: string, fieldTemplate?: Partial<FormElement>, insertIndex?: number) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const targetSection = sections.find((s) => s.id === sectionId);
        const existingFields = targetSection?.fields || [];
        const existingCount = existingFields.length + 1;
        const usedSns = new Set(existingFields.map((f) => String(f.SN)));

        let fieldSn = fieldTemplate?.SN || String(existingCount);
        if (usedSns.has(fieldSn)) {
          let candidate = existingCount;
          while (usedSns.has(String(candidate))) {
            candidate++;
          }
          fieldSn = String(candidate);
        }
        const fieldName = fieldTemplate?.NAME || `field_${existingCount}`;
        const fieldLabel = fieldTemplate?.LABEL || `Field ${existingCount}`;

        const newField: FormElement = {
          ...fieldTemplate,
          SN: fieldSn,
          NAME: fieldName,
          LABEL: fieldLabel,
          TYPE: fieldTemplate?.TYPE || "String",
          LENGTH: fieldTemplate?.LENGTH ?? 35,
          STRUCTURE: fieldTemplate?.STRUCTURE || "S",
          REQUIRED: fieldTemplate?.REQUIRED ?? false,
          DISABLED: fieldTemplate?.DISABLED ?? false,
          WIDTH: fieldTemplate?.WIDTH ?? "md",
          POSITION: fieldTemplate?.POSITION || "",
          PARAMETER: fieldTemplate?.PARAMETER || {
            type: "O",
            data: [],
          },
          ENRICHTEXT: fieldTemplate?.ENRICHTEXT || "",
          DEFAULTVALUE: fieldTemplate?.DEFAULTVALUE || "",
        };

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

        setSelectedFieldId(fieldName);

        return {
          ...prev,
          frmElements: {
            sections: updatedSections,
          },
        };
      });
    },
    [setFormData, setSelectedFieldId],
  );

  const updateField = React.useCallback(
    (fieldId: string, patch: Partial<FormElement>) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        const updatedSections = sections.map((sec) => ({
          ...sec,
          fields: (sec.fields || []).map((f) =>
            isMatchingField(f, fieldId) ? { ...f, ...patch } : f,
          ),
        }));

        return {
          ...prev,
          frmElements: {
            sections: updatedSections,
          },
        };
      });
    },
    [setFormData],
  );

  const removeField = React.useCallback(
    (fieldId: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        const updatedSections = sections.map((sec) => ({
          ...sec,
          fields: (sec.fields || []).filter((f) => !isMatchingField(f, fieldId)),
        }));

        return {
          ...prev,
          frmElements: {
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
