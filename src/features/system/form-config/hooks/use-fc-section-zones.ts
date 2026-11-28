/**
 * @fileoverview Container zone conversion and tab grouping hook for Form Designer.
 * Transforms sections between Card boxes and Tab Group panes, and ungroups a card into standalone cards.
 *
 * @module features/system/form-config/hooks/use-fc-section-zones
 */

"use client";

import * as React from "react";
import { generateClientToken } from "@/lib/core-utils";
import type { FormConfigRecord, FormContainerType, FormSection } from "@/lib/data-schemas";
import type { SectionPlacement } from "../components/designer/canvas/canvas-types";
import { dissolveLoneTabGroup, takenContainerIds } from "./fc-field-tree";

/** @param readSections the latest sections, for ids made before an update (see useFcSectionOps) */
export function useFcSectionZones(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedSectionId: (id: string | null) => void,
  setSelectedFieldId: (id: string | null) => void,
  readSections: () => FormSection[],
) {
  const convertSectionZone = React.useCallback(
    (sectionId: string, targetType: FormContainerType, opts?: SectionPlacement) => {
      const newGroupId =
        targetType === "tab" && !opts?.groupId
          ? generateClientToken("tabgrp", takenContainerIds(readSections()))
          : undefined;
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const targetSec = sections.find((s) => s.id === sectionId);
        if (!targetSec) return prev;

        const originalGroupId = targetSec.containerType === "tab" ? targetSec.groupId : undefined;

        let updatedSec: FormSection;
        if (targetType === "tab") {
          const grpId = opts?.groupId || (newGroupId as string);
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

        // The tab left its old group: a group left with one tab becomes a card
        const leftGroup =
          originalGroupId && (targetType === "card" || opts?.groupId !== originalGroupId);

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: leftGroup
              ? dissolveLoneTabGroup(finalSections, originalGroupId)
              : finalSections,
          },
        };
      });
    },
    [readSections, setFormData],
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

  /** Unpacks a card's fields, each into its own untitled standalone card (an empty card stays). */
  const ungroupSection = React.useCallback(
    (id: string) => {
      const current = readSections();
      const fieldCount = current.find((s) => s.id === id)?.fields?.length ?? 0;
      if (fieldCount === 0) return;
      // One id per field, made before the update so the updater stays pure
      const taken = takenContainerIds(current);
      const newIds = Array.from({ length: fieldCount }, () => {
        const newId = generateClientToken("sec_field", taken);
        taken.add(newId);
        return newId;
      });

      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const secIndex = sections.findIndex((s) => s.id === id);
        if (secIndex === -1) return prev;

        const fields = sections[secIndex].fields || [];
        if (fields.length !== newIds.length) return prev;
        const standaloneSections: FormSection[] = fields.map((f, idx) => {
          const newId = newIds[idx];
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
    [readSections, setFormData, setSelectedSectionId, setSelectedFieldId],
  );

  return { convertSectionZone, mergeTabGroups, ungroupSection };
}
