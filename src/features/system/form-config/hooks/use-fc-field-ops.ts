"use client";

import * as React from "react";
import type {
  FormConfigRecord,
  FormElement,
  FormSection,
} from "@/lib/data-schemas/form-config-schema";

function isMatchingField(field: FormElement, identifier: string): boolean {
  return (
    field.NAME === identifier ||
    field.SN === identifier ||
    (field as unknown as Record<string, unknown>).id === identifier
  );
}

export function useFcFieldOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedFieldId: (id: string | null) => void,
  setSelectedSectionId?: (id: string | null) => void,
) {
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
          id: fieldTemplate?.id || fieldName,
          SN: fieldSn,
          NAME: fieldName,
          LABEL: fieldLabel,
          TYPE: fieldTemplate?.TYPE || "Text",
          LENGTH: fieldTemplate?.LENGTH ?? 35,
          STRUCTURE: fieldTemplate?.STRUCTURE || "S",
          REQUIRED: fieldTemplate?.REQUIRED ?? false,
          DISABLED: fieldTemplate?.DISABLED ?? false,
          WIDTH: fieldTemplate?.WIDTH ?? 200,
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
          VALUE: fieldTemplate?.VALUE || "",
          FIXEDVALUE: fieldTemplate?.FIXEDVALUE || "",
          ISOPEN: fieldTemplate?.ISOPEN ?? false,
          ISLOADING: fieldTemplate?.ISLOADING ?? false,
          PROP: fieldTemplate?.PROP || [],
          DATASOURCE: fieldTemplate?.DATASOURCE || [],
          DEFAULTVALUE: fieldTemplate?.DEFAULTVALUE || "",
        };

        const updatedSections = sections.map((sec) =>
          sec.id === sectionId ? { ...sec, fields: [...(sec.fields || []), newField] } : sec,
        );

        setSelectedFieldId(fieldName);

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
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
            steps: prev.frmElements?.steps || [],
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
              sec.layoutStyle === "plain" ||
              !sec.title ||
              sec.title === "Canvas Root" ||
              (sec.type === "standard" && sec.zone === "standard" && !sec.title);
            if (isPlainRoot && (!sec.fields || sec.fields.length === 0)) {
              return false;
            }
            return true;
          });

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: updatedSections,
          },
        };
      });

      setSelectedFieldId(null);
    },
    [setFormData, setSelectedFieldId],
  );

  const reorderFields = React.useCallback(
    (sectionId: string, activeId: string, overId: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const section = sections.find((s) => s.id === sectionId);
        if (!section?.fields) return prev;

        const oldIndex = section.fields.findIndex((f) => isMatchingField(f, activeId));
        const newIndex = section.fields.findIndex((f) => isMatchingField(f, overId));
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return prev;
        }

        const newFields = [...section.fields];
        const [moved] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, moved);

        const updatedSections = sections.map((s) =>
          s.id === sectionId ? { ...s, fields: newFields } : s,
        );

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: updatedSections,
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
        const sections = prev.frmElements?.sections || [];
        const sourceSec = sections.find((s) => s.id === sourceSecId);
        if (!sourceSec?.fields) return prev;

        const fieldIndex = sourceSec.fields.findIndex((f) => isMatchingField(f, fieldId));
        if (fieldIndex === -1) return prev;

        const fieldToMove = sourceSec.fields[fieldIndex];

        if (targetSecId === "canvas-root" || targetSecId.startsWith("gap-")) {
          const newRootSec: FormSection = {
            id: `sec_root_${crypto.randomUUID().slice(0, 8)}`,
            title: "",
            type: "standard",
            zone: "standard",
            columns: 1,
            collapsible: false,
            isCollapsed: false,
            layoutStyle: "plain",
            fields: [fieldToMove],
          };

          const newSections = sections
            .map((s) =>
              s.id === sourceSecId
                ? {
                    ...s,
                    fields: s.fields.filter((f) => !isMatchingField(f, fieldId)),
                  }
                : s,
            )
            .filter(
              (s) =>
                !(s.layoutStyle === "plain" && !s.title && (!s.fields || s.fields.length === 0)),
            );

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
              existingRoot.fields = [...(existingRoot.fields || []), fieldToMove];
              return {
                ...prev,
                frmElements: {
                  steps: prev.frmElements?.steps || [],
                  sections: newSections,
                },
              };
            }
            newSections.push(newRootSec);
          }

          return {
            ...prev,
            frmElements: {
              steps: prev.frmElements?.steps || [],
              sections: newSections,
            },
          };
        }

        const targetSec = sections.find((s) => s.id === targetSecId);
        if (!targetSec) return prev;

        if (sourceSecId === targetSecId) {
          if (!targetFieldId || targetFieldId === fieldId) return prev;
          const targetIndex = (targetSec.fields || []).findIndex((f) =>
            isMatchingField(f, targetFieldId),
          );
          if (targetIndex === -1) return prev;
          const newFields = [...(sourceSec.fields || [])];
          newFields.splice(fieldIndex, 1);
          newFields.splice(targetIndex, 0, fieldToMove);

          const updatedSections = sections.map((s) =>
            s.id === sourceSecId ? { ...s, fields: newFields } : s,
          );

          return {
            ...prev,
            frmElements: {
              steps: prev.frmElements?.steps || [],
              sections: updatedSections,
            },
          };
        }

        const newSourceFields = (sourceSec.fields || []).filter(
          (f) => !isMatchingField(f, fieldId),
        );
        const newTargetFields = [...(targetSec.fields || [])];

        if (targetFieldId) {
          const targetIndex = newTargetFields.findIndex((f) => isMatchingField(f, targetFieldId));
          if (targetIndex !== -1) {
            newTargetFields.splice(targetIndex, 0, fieldToMove);
          } else {
            newTargetFields.push(fieldToMove);
          }
        } else {
          newTargetFields.push(fieldToMove);
        }

        const updatedSections = sections
          .map((s) => {
            if (s.id === sourceSecId) return { ...s, fields: newSourceFields };
            if (s.id === targetSecId) return { ...s, fields: newTargetFields };
            return s;
          })
          .filter(
            (s) => !(s.layoutStyle === "plain" && !s.title && (!s.fields || s.fields.length === 0)),
          );

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
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
