/**
 * @fileoverview Container zone conversion and tab grouping hook for Form Designer.
 * Transforms sections between Card boxes and Tab Group panes, and ungroups a card into standalone cards.
 *
 * @module features/system/form-config/hooks/use-fc-section-zones
 */

"use client";

import * as React from "react";
import { generateClientToken } from "@/lib/core-utils";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas";
import { takenContainerIds } from "./fc-field-tree";

export function useFcSectionZones(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedSectionId: (id: string | null) => void,
  setSelectedFieldId: (id: string | null) => void,
) {
  const convertSectionZone = React.useCallback(
    (
      sectionId: string,
      targetType: "card" | "tab",
      opts?: { groupId?: string; groupTitle?: string; insertIndex?: number },
    ) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const targetSec = sections.find((s) => s.id === sectionId);
        if (!targetSec) return prev;

        const originalGroupId = targetSec.containerType === "tab" ? targetSec.groupId : undefined;

        let updatedSec: FormSection;
        if (targetType === "tab") {
          const grpId = opts?.groupId || generateClientToken("tabgrp", takenContainerIds(sections));
          const title = opts?.groupTitle || targetSec.title || "Tab";
          updatedSec = {
            ...targetSec,
            containerType: "tab" as const,
            groupId: grpId,
            groupTitle: title,
            title: targetSec.title || title,
          };
        } else {
          updatedSec = {
            ...targetSec,
            containerType: "card" as const,
            groupId: undefined,
            groupTitle: undefined,
          };
        }

        const remainingSections = sections.filter((s) => s.id !== sectionId);

        let finalSections: FormSection[];
        if (opts?.insertIndex !== undefined) {
          finalSections = [...remainingSections];
          const boundedIndex = Math.max(0, Math.min(opts.insertIndex, finalSections.length));
          finalSections.splice(boundedIndex, 0, updatedSec);
        } else if (targetType === "tab" && opts?.groupId) {
          const lastGroupPeerIdx = remainingSections
            .map((s, idx) => (s.containerType === "tab" && s.groupId === opts.groupId ? idx : -1))
            .filter((idx) => idx !== -1)
            .pop();

          finalSections = [...remainingSections];
          if (lastGroupPeerIdx !== undefined) {
            finalSections.splice(lastGroupPeerIdx + 1, 0, updatedSec);
          } else {
            finalSections.push(updatedSec);
          }
        } else {
          const origIdx = sections.findIndex((s) => s.id === sectionId);
          finalSections = [...remainingSections];
          const safeIdx = Math.max(0, Math.min(origIdx, finalSections.length));
          finalSections.splice(safeIdx, 0, updatedSec);
        }

        // Auto-dissolve old tab group if only 1 tab remains in it
        if (
          originalGroupId &&
          (targetType === "card" || (targetType === "tab" && opts?.groupId !== originalGroupId))
        ) {
          const remainingTabsInOldGroup = finalSections.filter(
            (s) => s.containerType === "tab" && s.groupId === originalGroupId,
          );
          if (remainingTabsInOldGroup.length === 1) {
            const singleTab = remainingTabsInOldGroup[0];
            const idx = finalSections.findIndex((s) => s.id === singleTab.id);
            if (idx !== -1) {
              finalSections[idx] = {
                ...singleTab,
                containerType: "card",
                groupId: undefined,
                groupTitle: undefined,
              };
            }
          }
        }

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: finalSections,
          },
        };
      });
    },
    [setFormData],
  );

  const mergeTabGroups = React.useCallback(
    (sourceGroupId: string, targetGroupId: string) => {
      if (!sourceGroupId || !targetGroupId || sourceGroupId === targetGroupId) return;
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: sections.map((sec) => {
              if (sec.containerType === "tab" && sec.groupId === sourceGroupId) {
                return {
                  ...sec,
                  groupId: targetGroupId,
                };
              }
              return sec;
            }),
          },
        };
      });
    },
    [setFormData],
  );

  /** Unpacks a card's fields, each into its own untitled standalone card. */
  const ungroupSection = React.useCallback(
    (id: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const secIndex = sections.findIndex((s) => s.id === id);
        if (secIndex === -1) return prev;

        const taken = takenContainerIds(sections);
        const standaloneSections: FormSection[] = (sections[secIndex].fields || []).map((f) => {
          const newId = generateClientToken("sec_field", taken);
          taken.add(newId);
          return {
            id: newId,
            title: "",
            containerType: "card" as const,
            columns: 1,
            collapsible: false,
            isCollapsed: false,
            fields: [f],
          };
        });

        const updatedSections = [...sections];
        updatedSections.splice(secIndex, 1, ...standaloneSections);
        return { ...prev, frmElements: { ...prev.frmElements, sections: updatedSections } };
      });

      setSelectedSectionId(null);
      setSelectedFieldId(null);
    },
    [setFormData, setSelectedSectionId, setSelectedFieldId],
  );

  return { convertSectionZone, mergeTabGroups, ungroupSection };
}
