"use client";

import * as React from "react";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
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
      containerType: "card" | "plain" | "tab" | "step" | "accordion" = "card",
      initialFields: FormElement[] = [],
      customTitle?: string,
      groupId?: string,
      groupTitle?: string,
      insertIndex?: number,
      columns?: number,
    ) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const nextIndex = sections.length + 1;
        const newId = `sec_${nextIndex}`;
        const defaultTitle =
          customTitle !== undefined
            ? customTitle
            : containerType === "plain"
              ? ""
              : containerType === "tab"
                ? groupTitle || `Tab ${nextIndex}`
                : "Form Fields";

        const newSection: FormSection = {
          id: newId,
          title: defaultTitle,
          containerType,
          groupId: containerType === "tab" ? groupId || `tabgrp_${nextIndex}` : groupId,
          groupTitle:
            containerType === "tab" ? groupTitle || defaultTitle || `Tab ${nextIndex}` : groupTitle,
          columns: columns ?? 1,
          collapsible: false,
          isCollapsed: false,
          fields: initialFields,
        };

        const newFieldKeys = new Set(
          initialFields.map((f) => f.NAME || f.SN || (f as unknown as { id?: string }).id),
        );
        const cleanedExistingSections = sections
          .map((sec) => ({
            ...sec,
            fields: (sec.fields || []).filter(
              (f) =>
                !newFieldKeys.has(f.NAME) &&
                !newFieldKeys.has(f.SN) &&
                !newFieldKeys.has((f as unknown as { id?: string }).id),
            ),
          }))
          .filter((sec) => {
            const isPlainRoot =
              sec.containerType === "plain" || !sec.title || sec.title === "Canvas Root";
            if (isPlainRoot && (!sec.fields || sec.fields.length === 0)) {
              return false;
            }
            return true;
          });

        let updatedSections: FormSection[];
        if (
          insertIndex !== undefined &&
          insertIndex >= 0 &&
          insertIndex <= cleanedExistingSections.length
        ) {
          updatedSections = [...cleanedExistingSections];
          updatedSections.splice(insertIndex, 0, newSection);
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

        const updatedSections = sections.map((sec) => {
          if (sec.id === id) {
            return { ...sec, ...patch };
          }
          if (
            patch.groupId &&
            targetSec?.containerType === "tab" &&
            sec.containerType === "tab" &&
            sec.groupId === targetSec.groupId
          ) {
            return { ...sec, groupId: patch.groupId };
          }
          return sec;
        });

        return {
          ...prev,
          frmElements: {
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
    reorderSections: reorder.reorderSections,
    convertSectionZone: zones.convertSectionZone,
    mergeTabGroups: zones.mergeTabGroups,
  };
}
