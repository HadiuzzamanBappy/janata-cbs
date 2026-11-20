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
import type {
  ContainerConfig,
  FormConfigRecord,
  FormContainerType,
  FormElement,
  FormSection,
} from "@/lib/data-schemas";
import { useFcSectionReorder } from "./use-fc-section-reorder";
import { useFcSectionZones } from "./use-fc-section-zones";

export function useFcSectionOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedSectionId: (id: string | null) => void,
  setSelectedFieldId: (id: string | null) => void,
) {
  const zones = useFcSectionZones(setFormData);
  const reorder = useFcSectionReorder(setFormData);

  const addSection = React.useCallback(
    (
      containerType: FormContainerType = "card",
      initialFields: FormElement[] = [],
      customTitle?: string,
      groupId?: string,
      groupTitle?: string,
      insertIndex?: number,
      columns?: number,
      containerConfig?: ContainerConfig,
    ) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const nextIndex = sections.length + 1;
        const newId = generateClientToken("sec");
        const defaultTitle =
          customTitle !== undefined
            ? customTitle
            : containerType === "tab"
              ? groupTitle || `Tab ${nextIndex}`
              : "";

        const targetGroupId =
          containerType === "tab" ? groupId || generateClientToken("tabgrp") : groupId;
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

        const newFieldKeys = new Set(initialFields.map((f) => f.NAME || f.SN));
        const cleanedExistingSections = sections
          .map((sec) => ({
            ...sec,
            fields: (sec.fields || []).filter(
              (f) => !newFieldKeys.has(f.NAME) && !newFieldKeys.has(f.SN),
            ),
          }))
          .filter((sec) => {
            const isEmptySection = !sec.title && (!sec.fields || sec.fields.length === 0);
            return !isEmptySection;
          });

        let updatedSections: FormSection[];
        if (insertIndex !== undefined) {
          const boundedIndex = Math.max(0, Math.min(insertIndex, cleanedExistingSections.length));
          updatedSections = [...cleanedExistingSections];
          updatedSections.splice(boundedIndex, 0, newSection);
        } else {
          updatedSections = [...cleanedExistingSections, newSection];
        }

        setSelectedSectionId(newId);
        if (initialFields.length > 0) {
          setSelectedFieldId(initialFields[0].NAME || initialFields[0].SN);
        }

        return {
          ...prev,
          frmElements: {
            ...prev.frmElements,
            sections: updatedSections,
          },
        };
      });
    },
    [setFormData, setSelectedSectionId, setSelectedFieldId],
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

        const isTabSection = secToRemove.containerType === "tab";
        const groupId = secToRemove.groupId;

        const updatedSections = sections.filter((sec) => sec.id !== id);

        if (isTabSection && groupId) {
          const remainingTabsInGroup = updatedSections.filter(
            (s) => s.containerType === "tab" && s.groupId === groupId,
          );
          if (remainingTabsInGroup.length === 1) {
            const singleTab = remainingTabsInGroup[0];
            const idx = updatedSections.findIndex((s) => s.id === singleTab.id);
            if (idx !== -1) {
              updatedSections[idx] = {
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
            sections: updatedSections,
          },
        };
      });

      setSelectedSectionId(null);
      setSelectedFieldId(null);
    },
    [setFormData, setSelectedSectionId, setSelectedFieldId],
  );

  const ungroupSection = React.useCallback(
    (id: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const secIndex = sections.findIndex((s) => s.id === id);
        if (secIndex === -1) return prev;

        const secToUngroup = sections[secIndex];
        const fields = secToUngroup?.fields || [];

        // If card has fields, unpack each field into an untitled standalone section
        const standaloneSections: FormSection[] = fields.map((f) => ({
          id: generateClientToken("sec_field"),
          title: "",
          containerType: "card" as const,
          columns: 1,
          collapsible: false,
          isCollapsed: false,
          fields: [f],
        }));

        const updatedSections = [...sections];
        updatedSections.splice(secIndex, 1, ...standaloneSections);

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
    ungroupSection,
    reorderSections: reorder.reorderSections,
    convertSectionZone: zones.convertSectionZone,
    mergeTabGroups: zones.mergeTabGroups,
  };
}
