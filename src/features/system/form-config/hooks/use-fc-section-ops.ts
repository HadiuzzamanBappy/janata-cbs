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
      type: "standard" | "object-group" | "array-table" = "standard",
      zone: "header" | "tab" | "standard" = "standard",
      initialFields: FormElement[] = [],
      layoutStyle?: "card" | "plain",
      customTitle?: string,
      tabGroupId?: string,
      tabTitle?: string,
      insertIndex?: number,
      columns?: number,
      bindKey?: string,
      structure?: "S" | "M",
    ) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const nextIndex = sections.length + 1;
        const newId = `sec_${nextIndex}`;
        const defaultTitle =
          customTitle !== undefined
            ? customTitle
            : layoutStyle === "plain"
              ? ""
              : zone === "header"
                ? "Master Header Card"
                : zone === "tab"
                  ? tabTitle || `Tab ${nextIndex}`
                  : type === "object-group"
                    ? "New Object Group"
                    : "Form Fields";

        const isObjGroup = type === "object-group";
        const newSection: FormSection = {
          id: newId,
          title: defaultTitle,
          type,
          zone,
          tabGroupId: zone === "tab" ? tabGroupId || `tabgrp_${nextIndex}` : undefined,
          tabTitle: zone === "tab" ? tabTitle || defaultTitle || `Tab ${nextIndex}` : undefined,
          bindKey: bindKey || (type !== "standard" ? `group_${nextIndex}` : undefined),
          structure: structure || "S",
          columns: columns ?? 1,
          collapsible: false,
          isCollapsed: false,
          layoutStyle:
            layoutStyle ??
            (isObjGroup || (type === "standard" && zone === "standard" && !customTitle)
              ? "plain"
              : "card"),
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
              sec.layoutStyle === "plain" ||
              !sec.title ||
              sec.title === "Canvas Root" ||
              (sec.type === "standard" && sec.zone === "standard" && !sec.title);
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
            steps: prev.frmElements?.steps || [],
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
            patch.tabGroupId &&
            targetSec?.zone === "tab" &&
            sec.zone === "tab" &&
            sec.tabGroupId === targetSec.tabGroupId
          ) {
            return { ...sec, tabGroupId: patch.tabGroupId };
          }
          return sec;
        });

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

  const removeSection = React.useCallback(
    (id: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        const secToRemove = sections.find((s) => s.id === id);
        if (!secToRemove) return prev;

        const isTabSection = secToRemove.zone === "tab";
        const tabGroupId = secToRemove.tabGroupId;

        const updatedSections = sections.filter((sec) => sec.id !== id);

        if (isTabSection && tabGroupId) {
          const remainingTabsInGroup = updatedSections.filter(
            (s) => s.zone === "tab" && s.tabGroupId === tabGroupId,
          );
          if (remainingTabsInGroup.length === 1) {
            const singleTab = remainingTabsInGroup[0];
            const idx = updatedSections.findIndex((s) => s.id === singleTab.id);
            if (idx !== -1) {
              updatedSections[idx] = {
                ...singleTab,
                zone: "standard",
                tabGroupId: undefined,
                tabTitle: undefined,
                layoutStyle: "card",
              };
            }
          }
        }

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
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
