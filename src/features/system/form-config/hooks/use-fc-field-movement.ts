"use client";

import * as React from "react";
import { generateClientToken } from "@/lib/core-utils";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";

export function isMatchingField(field: FormElement, identifier: string): boolean {
  return (
    field.SN === identifier ||
    field.NAME === identifier ||
    (field as unknown as Record<string, unknown>).id === identifier
  );
}

export function useFcFieldMovement(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedFieldId: (id: string | null) => void,
  setSelectedSectionId?: (id: string | null) => void,
) {
  const reorderFields = React.useCallback(
    (sectionId: string, activeId: string, overId: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const secIndex = sections.findIndex((s) => s.id === sectionId);
        if (secIndex === -1) return prev;

        const sec = sections[secIndex];
        const fields = [...(sec.fields || [])];

        const oldIdx = fields.findIndex((f) => isMatchingField(f, activeId));
        const newIdx = fields.findIndex((f) => isMatchingField(f, overId));

        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;

        const [movedField] = fields.splice(oldIdx, 1);
        fields.splice(newIdx, 0, movedField);

        const updatedSections = [...sections];
        updatedSections[secIndex] = { ...sec, fields };

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: updatedSections,
          },
        };
      });
      setSelectedFieldId(activeId);
    },
    [setFormData, setSelectedFieldId],
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
            id: generateClientToken("sec_root"),
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
            .filter((s) => s.fields.length > 0 || Boolean(s.title));

          let insertAt = newSections.length;
          if (targetSecId.startsWith("gap-")) {
            const rawIdx = parseInt(targetSecId.replace("gap-", ""), 10);
            if (!Number.isNaN(rawIdx)) insertAt = Math.min(rawIdx, newSections.length);
          }

          newSections.splice(insertAt, 0, newRootSec);

          return {
            ...prev,
            frmElements: {
              ...prev.frmElements,
              sections: newSections,
            },
          };
        }

        const targetSec = sections.find((s) => s.id === targetSecId);
        if (!targetSec) return prev;

        const updatedSourceFields = sourceSec.fields.filter((f) => !isMatchingField(f, fieldId));
        const updatedTargetFields = [...(targetSec.fields || [])];

        let targetIdx = updatedTargetFields.length;
        if (targetFieldId) {
          const foundIdx = updatedTargetFields.findIndex((f) => isMatchingField(f, targetFieldId));
          if (foundIdx !== -1) targetIdx = foundIdx;
        } else if (typeof insertAtIndex === "number") {
          targetIdx = Math.max(0, Math.min(insertAtIndex, updatedTargetFields.length));
        }

        updatedTargetFields.splice(targetIdx, 0, fieldToMove);

        const newSections = sections
          .map((s) => {
            if (s.id === sourceSecId) return { ...s, fields: updatedSourceFields };
            if (s.id === targetSecId) return { ...s, fields: updatedTargetFields };
            return s;
          })
          .filter((s) => s.fields.length > 0 || Boolean(s.title));

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: newSections,
          },
        };
      });

      setSelectedFieldId(fieldId);
      if (setSelectedSectionId) {
        setSelectedSectionId(targetSecId);
      }
    },
    [setFormData, setSelectedFieldId, setSelectedSectionId],
  );

  return {
    reorderFields,
    moveFieldAcrossSections,
  };
}
