"use client";

import * as React from "react";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import { isMatchingField, useFcFieldMovement } from "./use-fc-field-movement";

export function useFcFieldOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedFieldId: (id: string | null) => void,
  setSelectedSectionId?: (id: string | null) => void,
) {
  const movement = useFcFieldMovement(setFormData, setSelectedFieldId, setSelectedSectionId);

  const addFieldToSection = React.useCallback(
    (sectionId: string, fieldTemplate?: Partial<FormElement>) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const targetSection = sections.find((s) => s.id === sectionId);
        const existingCount = (targetSection?.fields?.length || 0) + 1;

        const fieldSn = fieldTemplate?.SN || String(existingCount);
        const fieldName = fieldTemplate?.NAME || `field_${existingCount}`;
        const fieldLabel = fieldTemplate?.LABEL || `Field ${existingCount}`;

        const newField: FormElement = {
          SN: fieldSn,
          NAME: fieldName,
          LABEL: fieldLabel,
          TYPE: fieldTemplate?.TYPE || "Text",
          LENGTH: fieldTemplate?.LENGTH ?? 35,
          STRUCTURE: fieldTemplate?.STRUCTURE || "S",
          REQUIRED: fieldTemplate?.REQUIRED ?? false,
          DISABLED: fieldTemplate?.DISABLED ?? false,
          WIDTH: fieldTemplate?.WIDTH ?? "md",
          POSITION: fieldTemplate?.POSITION || "",
          PARAMETER: fieldTemplate?.PARAMETER || {
            type: "O",
            data: [],
            modelName: "",
            displayField: "",
            condition: "",
            reference: "",
          },
          ENRICHTEXT: fieldTemplate?.ENRICHTEXT || "",
          DEFAULTVALUE: fieldTemplate?.DEFAULTVALUE || "",
        };

        const updatedSections = sections.map((sec) =>
          sec.id === sectionId ? { ...sec, fields: [...(sec.fields || []), newField] } : sec,
        );

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

        const updatedSections = sections
          .map((sec) => ({
            ...sec,
            fields: (sec.fields || []).filter((f) => !isMatchingField(f, fieldId)),
          }))
          .filter((sec) => {
            const isPlainRoot =
              sec.containerType === "plain" || !sec.title || sec.title === "Canvas Root";
            if (isPlainRoot && (!sec.fields || sec.fields.length === 0)) {
              return false;
            }
            return true;
          });

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
