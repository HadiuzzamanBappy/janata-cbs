/**
 * @fileoverview Section reordering hook for Form Designer.
 * Reorders standalone cards or clusters of grouped tabs on the canvas.
 *
 * @module features/system/form-config/hooks/use-fc-section-reorder
 */

"use client";

import * as React from "react";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas";

export function useFcSectionReorder(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
) {
  const reorderSections = React.useCallback(
    (activeId: string, overId: string, insertIndex?: number) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const activeSection = sections.find((s) => s.id === activeId);
        if (!activeSection) return prev;

        const overSection = overId ? sections.find((s) => s.id === overId) : undefined;

        // Check if this is an internal tab reorder within the same tab group
        const isInternalTabReorder =
          activeSection.containerType === "tab" &&
          overSection?.containerType === "tab" &&
          Boolean(activeSection.groupId) &&
          activeSection.groupId === overSection?.groupId &&
          insertIndex === undefined;

        let movingSections: FormSection[];
        if (isInternalTabReorder) {
          // Move only the single tab being reordered within its group
          movingSections = [activeSection];
        } else if (activeSection.containerType === "tab" && activeSection.groupId) {
          // Moving entire tab group across the canvas
          movingSections = sections.filter(
            (s) => s.containerType === "tab" && s.groupId === activeSection.groupId,
          );
        } else {
          movingSections = [activeSection];
        }

        let targetIndex = -1;
        if (insertIndex !== undefined) {
          targetIndex = insertIndex;
        } else if (overSection) {
          targetIndex = sections.findIndex((s) => s.id === overId);
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
            ...prev.frmElements,
            sections: newSections,
          },
        };
      });
    },
    [setFormData],
  );

  return { reorderSections };
}
