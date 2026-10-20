"use client";

import * as React from "react";
import type {
  FormConfigRecord,
  FormFieldItem,
  FormSection,
} from "@/lib/data-schemas/form-config-schema";

export function useFcFieldOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedFieldId: (id: string | null) => void,
  setSelectedSectionId?: (id: string | null) => void,
) {
  const addFieldToSection = React.useCallback(
    (sectionId: string, fieldTemplate?: Partial<FormFieldItem>) => {
      const fieldId = `f_${Date.now()}`;
      const newField: FormFieldItem = {
        id: fieldId,
        fieldKey: fieldTemplate?.fieldKey || `field_${Date.now().toString().slice(-4)}`,
        label: fieldTemplate?.label || "New Field",
        widget: fieldTemplate?.widget || "text",
        colSpan: fieldTemplate?.colSpan || 6,
        required: fieldTemplate?.required || false,
        readOnly: fieldTemplate?.readOnly || false,
        hidden: false,
        placeholder: fieldTemplate?.placeholder || "",
        options: fieldTemplate?.options,
        currencyPrefix: fieldTemplate?.currencyPrefix,
        formula: fieldTemplate?.formula,
        modelType: fieldTemplate?.modelType,
        parameter: fieldTemplate?.parameter,
      };

      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) =>
            sec.id === sectionId ? { ...sec, fields: [...sec.fields, newField] } : sec,
          ),
        },
      }));
      setSelectedFieldId(fieldId);
    },
    [setFormData, setSelectedFieldId],
  );

  const updateField = React.useCallback(
    (fieldId: string, patch: Partial<FormFieldItem>) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) => ({
            ...sec,
            fields: sec.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
          })),
        },
      }));
    },
    [setFormData],
  );

  const removeField = React.useCallback(
    (fieldId: string) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) => ({
            ...sec,
            fields: sec.fields.filter((f) => f.id !== fieldId),
          })),
        },
      }));
      setSelectedFieldId(null);
    },
    [setFormData, setSelectedFieldId],
  );

  const reorderFields = React.useCallback(
    (sectionId: string, activeId: string, overId: string) => {
      setFormData((prev) => {
        const section = prev.presentation.sections.find((s) => s.id === sectionId);
        if (!section) return prev;

        const oldIndex = section.fields.findIndex((f) => f.id === activeId);
        const newIndex = section.fields.findIndex((f) => f.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

        const newFields = [...section.fields];
        const [moved] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, moved);

        return {
          ...prev,
          presentation: {
            ...prev.presentation,
            sections: prev.presentation.sections.map((s) =>
              s.id === sectionId ? { ...s, fields: newFields } : s,
            ),
          },
        };
      });
    },
    [setFormData],
  );

  const moveFieldAcrossSections = React.useCallback(
    (
      sourceSecId: string,
      targetSecId: string,
      fieldId: string,
      targetFieldId?: string,
      insertAtIndex?: number,
    ) => {
      setFormData((prev) => {
        const sourceSec = prev.presentation.sections.find((s) => s.id === sourceSecId);
        if (!sourceSec) return prev;

        const fieldIndex = sourceSec.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex === -1) return prev;

        const fieldToMove = sourceSec.fields[fieldIndex];

        if (targetSecId === "canvas-root" || targetSecId.startsWith("gap-")) {
          const newRootSec: FormSection = {
            id: `sec_root_${Date.now()}`,
            title: "",
            type: "standard",
            zone: "standard",
            columns: 2,
            collapsible: false,
            isCollapsed: false,
            layoutStyle: "plain",
            fields: [fieldToMove],
          };

          const newSections = prev.presentation.sections
            .map((s) =>
              s.id === sourceSecId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s,
            )
            .filter((s) => !(s.layoutStyle === "plain" && !s.title && s.fields.length === 0));

          if (
            insertAtIndex !== undefined &&
            insertAtIndex >= 0 &&
            insertAtIndex <= newSections.length
          ) {
            newSections.splice(insertAtIndex, 0, newRootSec);
          } else {
            const existingRoot = newSections.find(
              (s) => s.layoutStyle === "plain" || !s.title || s.title === "Canvas Root",
            );
            if (existingRoot) {
              existingRoot.fields.push(fieldToMove);
              return {
                ...prev,
                presentation: { ...prev.presentation, sections: newSections },
              };
            }
            newSections.push(newRootSec);
          }

          return {
            ...prev,
            presentation: {
              ...prev.presentation,
              sections: newSections,
            },
          };
        }

        const targetSec = prev.presentation.sections.find((s) => s.id === targetSecId);
        if (!targetSec) return prev;

        if (sourceSecId === targetSecId) {
          if (!targetFieldId || targetFieldId === fieldId) return prev;
          const targetIndex = targetSec.fields.findIndex((f) => f.id === targetFieldId);
          if (targetIndex === -1) return prev;
          const newFields = [...sourceSec.fields];
          newFields.splice(fieldIndex, 1);
          newFields.splice(targetIndex, 0, fieldToMove);
          return {
            ...prev,
            presentation: {
              ...prev.presentation,
              sections: prev.presentation.sections.map((s) =>
                s.id === sourceSecId ? { ...s, fields: newFields } : s,
              ),
            },
          };
        }

        const newSourceFields = sourceSec.fields.filter((f) => f.id !== fieldId);
        const newTargetFields = [...targetSec.fields];

        if (targetFieldId) {
          const targetIndex = newTargetFields.findIndex((f) => f.id === targetFieldId);
          if (targetIndex !== -1) {
            newTargetFields.splice(targetIndex, 0, fieldToMove);
          } else {
            newTargetFields.push(fieldToMove);
          }
        } else {
          newTargetFields.push(fieldToMove);
        }

        const updatedSections = prev.presentation.sections
          .map((s) => {
            if (s.id === sourceSecId) return { ...s, fields: newSourceFields };
            if (s.id === targetSecId) return { ...s, fields: newTargetFields };
            return s;
          })
          .filter((s) => !(s.layoutStyle === "plain" && !s.title && s.fields.length === 0));

        return {
          ...prev,
          presentation: {
            ...prev.presentation,
            sections: updatedSections,
          },
        };
      });

      setSelectedFieldId(fieldId);
      if (
        setSelectedSectionId &&
        targetSecId !== "canvas-root" &&
        !targetSecId.startsWith("gap-")
      ) {
        setSelectedSectionId(targetSecId);
      }
    },
    [setFormData, setSelectedFieldId, setSelectedSectionId],
  );

  return {
    addFieldToSection,
    updateField,
    removeField,
    reorderFields,
    moveFieldAcrossSections,
  };
}
