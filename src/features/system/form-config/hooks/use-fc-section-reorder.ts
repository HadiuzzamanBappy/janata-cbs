"use client";

import * as React from "react";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";

export function useFcSectionReorder(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
) {
  const reorderSections = React.useCallback(
    (activeId: string, overId: string, insertIndex?: number) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const activeSection = sections.find((s) => s.id === activeId);
        if (!activeSection) return prev;

        let movingSections: FormSection[] = [activeSection];
        if (activeSection.containerType === "tab" && activeSection.groupId) {
          movingSections = sections.filter(
            (s) => s.containerType === "tab" && s.groupId === activeSection.groupId,
          );
        }

        let targetIndex = -1;
        if (insertIndex !== undefined) {
          targetIndex = insertIndex;
        } else if (overId) {
          const overSection = sections.find((s) => s.id === overId);
          if (overSection) {
            targetIndex = sections.findIndex((s) => s.id === overId);
          }
        }

        if (targetIndex === -1) return prev;

        const movingIds = new Set(movingSections.map((s) => s.id));
        const targetRefSec = sections[targetIndex];
        const remaining = sections.filter((s) => !movingIds.has(s.id));

        let finalInsertIndex: number;
        if (targetRefSec && !movingIds.has(targetRefSec.id)) {
          finalInsertIndex = remaining.findIndex((s) => s.id === targetRefSec.id);
          if (finalInsertIndex === -1) finalInsertIndex = remaining.length;
        } else if (targetIndex >= sections.length) {
          finalInsertIndex = remaining.length;
        } else {
          finalInsertIndex = Math.min(Math.max(0, targetIndex), remaining.length);
        }

        const newSections = [...remaining];
        newSections.splice(finalInsertIndex, 0, ...movingSections);

        return {
          ...prev,
          frmElements: {
            sections: newSections,
          },
        };
      });
    },
    [setFormData],
  );

  return { reorderSections };
}
