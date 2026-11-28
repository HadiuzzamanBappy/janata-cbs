/**
 * @fileoverview Section lifecycle and container operations hook for Form Designer.
 * Coordinates adding, updating, removing, and tab group clustering of sections.
 *
 * @module features/system/form-config/hooks/use-fc-section-ops
 */

"use client";

import * as React from "react";
import { buildRenderBlocks } from "@/lib/cbs-form-spec";
import { generateClientToken } from "@/lib/core-utils";
import type { FormConfigRecord, FormContainerType, FormSection } from "@/lib/data-schemas";
import type { NewSectionOptions } from "../components/designer/canvas/canvas-types";
import { dissolveLoneTabGroup, takenContainerIds } from "./fc-field-tree";
import { useFcSectionReorder } from "./use-fc-section-reorder";
import { useFcSectionZones } from "./use-fc-section-zones";

/**
 * @param readSections the latest sections, read when a new id must be made before an update
 *   (updaters stay pure: React may run them twice)
 */
export function useFcSectionOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedSectionId: (id: string | null) => void,
  setSelectedFieldId: (id: string | null) => void,
  readSections: () => FormSection[],
) {
  const zones = useFcSectionZones(
    setFormData,
    setSelectedSectionId,
    setSelectedFieldId,
    readSections,
  );
  const reorder = useFcSectionReorder(setFormData);

  const addSection = React.useCallback(
    (containerType: FormContainerType, options: NewSectionOptions = {}) => {
      const {
        fields: initialFields = [],
        title: customTitle,
        groupId,
        groupTitle,
        insertIndex,
        columns,
        containerConfig,
      } = options;
      // Ids are made before the update, so the updater stays pure (React may call it twice)
      const taken = takenContainerIds(readSections());
      const newId = generateClientToken("sec", taken);
      const targetGroupId =
        containerType === "tab"
          ? groupId || generateClientToken("tabgrp", new Set([...taken, newId]))
          : groupId;

      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const nextIndex = sections.length + 1;
        const defaultTitle =
          customTitle !== undefined
            ? customTitle
            : containerType === "tab"
              ? groupTitle || `Tab ${nextIndex}`
              : "";

        const existingTabInGroup =
          containerType === "tab" && targetGroupId
            ? sections.find((s) => s.containerType === "tab" && s.groupId === targetGroupId)
            : undefined;

        const newSection: FormSection = {
          id: newId,
          title: defaultTitle,
          containerType,
          groupId: targetGroupId,
          groupTitle:
            containerType === "tab" ? groupTitle || defaultTitle || `Tab ${nextIndex}` : groupTitle,
          columns: columns ?? 1,
          collapsible: false,
          isCollapsed: false,
          containerConfig: existingTabInGroup?.containerConfig
            ? { ...existingTabInGroup.containerConfig, ...containerConfig }
            : containerConfig,
          fields: initialFields,
        };

        // A field placed in the new section leaves wherever it was; only an untitled card this
        // emptied goes with it (an empty card the user made stays)
        const newFieldKeys = new Set(initialFields.map((f) => f.NAME || f.SN));
        const cleanedExistingSections = sections.flatMap((sec) => {
          const fields = (sec.fields || []).filter(
            (f) => !newFieldKeys.has(f.NAME) && !newFieldKeys.has(f.SN),
          );
          const emptiedByMove = fields.length === 0 && (sec.fields || []).length > 0;
          return emptiedByMove && !sec.title ? [] : [{ ...sec, fields }];
        });

        // Without an index, a new tab in an existing group goes after the group's last tab
        const count = cleanedExistingSections.length;
        const peerIdx = existingTabInGroup
          ? cleanedExistingSections.findLastIndex(
              (s) => s.containerType === "tab" && s.groupId === targetGroupId,
            )
          : -1;
        const at =
          insertIndex !== undefined
            ? Math.max(0, Math.min(insertIndex, count))
            : peerIdx >= 0
              ? peerIdx + 1
              : count;
        const updatedSections = [...cleanedExistingSections];
        updatedSections.splice(at, 0, newSection);

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: updatedSections,
          },
        };
      });

      setSelectedSectionId(newId);
      // Fields are found by SN first (fc-field-tree)
      if (initialFields.length > 0)
        setSelectedFieldId(initialFields[0].SN || initialFields[0].NAME);
    },
    [readSections, setFormData, setSelectedSectionId, setSelectedFieldId],
  );

  const updateSection = React.useCallback(
    (id: string, patch: Partial<FormSection>) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const targetSec = sections.find((s) => s.id === id);
        if (!targetSec) return prev;

        const isTab = targetSec.containerType === "tab";
        const blocks = isTab ? buildRenderBlocks(sections) : [];
        const targetBlock = blocks.find(
          (b) => b.type === "tab-group" && b.tabSections.some((s) => s.id === id),
        );
        const peerTabIds = new Set(
          targetBlock && targetBlock.type === "tab-group"
            ? targetBlock.tabSections.map((s) => s.id)
            : targetSec.groupId
              ? sections
                  .filter((s) => s.containerType === "tab" && s.groupId === targetSec.groupId)
                  .map((s) => s.id)
              : [id],
        );

        const hasTabGroupConfigPatch = Boolean(
          patch.containerConfig &&
            (patch.containerConfig.tabVariant !== undefined ||
              patch.containerConfig.heightMode !== undefined ||
              patch.containerConfig.minHeight !== undefined),
        );

        const updatedSections = sections.map((sec) => {
          if (sec.id === id) {
            return { ...sec, ...patch };
          }
          if (isTab && peerTabIds.has(sec.id)) {
            let peerSec = sec;
            if (patch.groupId) {
              peerSec = { ...peerSec, groupId: patch.groupId };
            }
            if (hasTabGroupConfigPatch && patch.containerConfig) {
              peerSec = {
                ...peerSec,
                containerConfig: {
                  ...peerSec.containerConfig,
                  ...(patch.containerConfig.tabVariant !== undefined
                    ? { tabVariant: patch.containerConfig.tabVariant }
                    : {}),
                  ...(patch.containerConfig.heightMode !== undefined
                    ? { heightMode: patch.containerConfig.heightMode }
                    : {}),
                  ...(patch.containerConfig.minHeight !== undefined
                    ? { minHeight: patch.containerConfig.minHeight }
                    : {}),
                },
              };
            }
            return peerSec;
          }
          return sec;
        });

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: updatedSections,
          },
        };
      });
    },
    [setFormData],
  );

  const removeSection = React.useCallback(
    (id: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const secToRemove = sections.find((s) => s.id === id);
        if (!secToRemove) return prev;

        const updatedSections = dissolveLoneTabGroup(
          sections.filter((sec) => sec.id !== id),
          secToRemove.containerType === "tab" ? secToRemove.groupId : undefined,
        );

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: updatedSections,
          },
        };
      });

      setSelectedSectionId(null);
      setSelectedFieldId(null);
    },
    [setFormData, setSelectedSectionId, setSelectedFieldId],
  );

  return {
    addSection,
    updateSection,
    removeSection,
    ungroupSection: zones.ungroupSection,
    reorderSections: reorder.reorderSections,
    convertSectionZone: zones.convertSectionZone,
    mergeTabGroups: zones.mergeTabGroups,
  };
}
