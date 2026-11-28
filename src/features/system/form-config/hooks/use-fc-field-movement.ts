/**
 * @fileoverview Field movement and reordering hook for Form Designer.
 * Handles intra-section sorting and inter-section movement.
 *
 * @module features/system/form-config/hooks/use-fc-field-movement
 */

"use client";

import * as React from "react";
import { generateClientToken } from "@/lib/core-utils";
import type { FormConfigRecord, FormElement, FormSection } from "@/lib/data-schemas";
import { isCanvasGapId } from "../components/designer/canvas/canvas-types";
import { takenContainerIds } from "./fc-field-tree";

export function isMatchingField(field: FormElement, identifier: string): boolean {
  return field.SN === identifier || field.NAME === identifier;
}

/** @param readSections the latest sections, for ids made before an update (see useFcSectionOps) */
export function useFcFieldMovement(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedFieldId: (id: string | null) => void,
  setSelectedSectionId: (id: string | null) => void,
  readSections: () => FormSection[],
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
      // Within one section this would drop the field (the source copy wins): that is reorderFields
      if (sourceSecId === targetSecId) return;
      // A drop on a gap makes the field its own card there; its id is made before the update
      const toGap = isCanvasGapId(targetSecId);
      const newCardId = toGap
        ? generateClientToken("sec_field", takenContainerIds(readSections()))
        : undefined;
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const sourceSec = sections.find((s) => s.id === sourceSecId);
        if (!sourceSec?.fields) return prev;

        const fieldIndex = sourceSec.fields.findIndex((f) => isMatchingField(f, fieldId));
        if (fieldIndex === -1) return prev;

        const fieldToMove = sourceSec.fields[fieldIndex];

        if (newCardId) {
          const newCardSec: FormSection = {
            id: newCardId,
            title: "",
            containerType: "card",
            columns: 1,
            collapsible: false,
            isCollapsed: false,
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
                Boolean(s.title?.trim()) ||
                s.containerType === "tab" ||
                (s.fields && s.fields.length > 0),
            );

          // The drag handler gives the gap's section index; without one the card goes last
          const insertAt = Math.max(
            0,
            Math.min(insertAtIndex ?? newSections.length, newSections.length),
          );

          newSections.splice(insertAt, 0, newCardSec);

          return {
            ...prev,
            frmElements: {
              ...prev.frmElements,
              sections: newSections,
            },
          };
        }

        const targetSec = sections.find((s) => s.id === targetSecId);
        // CRITICAL INVARIANT: Never delete or drop a field if target section is not found!
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

        const newSections = sections.map((s) => {
          if (s.id === sourceSecId) return { ...s, fields: updatedSourceFields };
          if (s.id === targetSecId) return { ...s, fields: updatedTargetFields };
          return s;
        });

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: newSections,
          },
        };
      });

      setSelectedFieldId(fieldId);
      setSelectedSectionId(newCardId ?? targetSecId);
    },
    [readSections, setFormData, setSelectedFieldId, setSelectedSectionId],
  );

  return {
    reorderFields,
    moveFieldAcrossSections,
  };
}
