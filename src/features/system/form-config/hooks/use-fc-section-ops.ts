"use client";

import * as React from "react";
import type {
  FormArchetype,
  FormConfigRecord,
  FormFieldItem,
  FormSection,
} from "@/lib/data-schemas/form-config-schema";

export function useFcSectionOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedSectionId: (id: string | null) => void,
  setSelectedFieldId: (id: string | null) => void,
) {
  const setArchetype = React.useCallback(
    (archetype: FormArchetype) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          archetype,
        },
      }));
    },
    [setFormData],
  );

  const addSection = React.useCallback(
    (
      type: "standard" | "object-group" | "array-table" = "standard",
      zone: "header" | "tab" | "standard" = "standard",
      initialFields: FormFieldItem[] = [],
      layoutStyle?: "card" | "plain",
      customTitle?: string,
      tabGroupId?: string,
      tabTitle?: string,
      insertIndex?: number,
      columns?: number,
    ) => {
      const newId = `sec_${Date.now()}`;
      const defaultTitle =
        customTitle !== undefined
          ? customTitle
          : layoutStyle === "plain"
            ? ""
            : zone === "header"
              ? "Master Header Card"
              : zone === "tab"
                ? tabTitle || "Tab 1"
                : type === "object-group"
                  ? "New Object Group"
                  : "Form Fields";

      const newSection: FormSection = {
        id: newId,
        title: defaultTitle,
        type,
        zone,
        tabGroupId: zone === "tab" ? tabGroupId || `tabgrp_${Date.now()}` : undefined,
        tabTitle: zone === "tab" ? tabTitle || defaultTitle || "Tab 1" : undefined,
        bindKey: type !== "standard" ? `group_${Date.now()}` : undefined,
        columns: columns ?? 1,
        collapsible: type !== "standard",
        isCollapsed: false,
        layoutStyle:
          layoutStyle ??
          (type === "standard" && zone === "standard" && !customTitle ? "plain" : "card"),
        fields: initialFields,
      };

      setFormData((prev) => {
        const nextSections = [...prev.presentation.sections];
        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= nextSections.length) {
          nextSections.splice(insertIndex, 0, newSection);
        } else {
          nextSections.push(newSection);
        }
        return {
          ...prev,
          presentation: {
            ...prev.presentation,
            sections: nextSections,
          },
        };
      });
      setSelectedSectionId(newId);
      if (initialFields.length > 0) {
        setSelectedFieldId(initialFields[0].id);
      }
    },
    [setFormData, setSelectedFieldId, setSelectedSectionId],
  );

  const updateSection = React.useCallback(
    (sectionId: string, patch: Partial<FormSection>) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) =>
            sec.id === sectionId ? { ...sec, ...patch } : sec,
          ),
        },
      }));
    },
    [setFormData],
  );

  const removeSection = React.useCallback(
    (sectionId: string) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.filter((sec) => sec.id !== sectionId),
        },
      }));
      setSelectedSectionId(null);
    },
    [setFormData, setSelectedSectionId],
  );

  const reorderSections = React.useCallback(
    (activeId: string, overId: string, insertIndex?: number) => {
      setFormData((prev) => {
        const oldIndex = prev.presentation.sections.findIndex((s) => s.id === activeId);
        if (oldIndex === -1) return prev;

        let newIndex = prev.presentation.sections.findIndex((s) => s.id === overId);
        if (insertIndex !== undefined) {
          newIndex = insertIndex;
        }
        if (newIndex === -1 || oldIndex === newIndex) return prev;

        const newSections = [...prev.presentation.sections];
        const [moved] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, moved);

        return {
          ...prev,
          presentation: {
            ...prev.presentation,
            sections: newSections,
          },
        };
      });
    },
    [setFormData],
  );

  const convertSectionZone = React.useCallback(
    (
      sectionId: string,
      targetZone: "standard" | "tab",
      opts?: { tabGroupId?: string; tabTitle?: string },
    ) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) => {
            if (sec.id !== sectionId) return sec;
            if (targetZone === "tab") {
              const grpId = opts?.tabGroupId || `tabgrp_${Date.now()}`;
              const title = opts?.tabTitle || sec.title || "New Tab";
              return {
                ...sec,
                zone: "tab" as const,
                tabGroupId: grpId,
                tabTitle: title,
                title,
                layoutStyle: "card" as const,
              };
            }
            return {
              ...sec,
              zone: "standard" as const,
              tabGroupId: undefined,
              tabTitle: undefined,
              layoutStyle: "card" as const,
            };
          }),
        },
      }));
    },
    [setFormData],
  );

  return {
    setArchetype,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    convertSectionZone,
  };
}
