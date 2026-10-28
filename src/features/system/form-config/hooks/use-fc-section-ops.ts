"use client";

import * as React from "react";
import type {
  FormConfigRecord,
  FormElement,
  FormSection,
} from "@/lib/data-schemas/form-config-schema";

export function useFcSectionOps(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
  setSelectedSectionId: (id: string | null) => void,
  setSelectedFieldId: (id: string | null) => void,
) {
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

        const newSection: FormSection = {
          id: newId,
          title: defaultTitle,
          type,
          zone,
          tabGroupId: zone === "tab" ? tabGroupId || `tabgrp_${nextIndex}` : undefined,
          tabTitle: zone === "tab" ? tabTitle || defaultTitle || `Tab ${nextIndex}` : undefined,
          bindKey: type !== "standard" ? `group_${nextIndex}` : undefined,
          columns: columns ?? 1,
          collapsible: type !== "standard",
          isCollapsed: false,
          layoutStyle:
            layoutStyle ??
            (type === "standard" && zone === "standard" && !customTitle ? "plain" : "card"),
          fields: initialFields,
        };

        // If initialFields contains fields already placed on canvas, remove them from existing sections
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
            return !isPlainRoot || (sec.fields && sec.fields.length > 0);
          });

        const nextSections = [...cleanedExistingSections];
        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= nextSections.length) {
          nextSections.splice(insertIndex, 0, newSection);
        } else {
          nextSections.push(newSection);
        }

        setSelectedSectionId(newId);
        if (initialFields.length > 0) {
          setSelectedFieldId(initialFields[0].NAME || initialFields[0].SN);
        }

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: nextSections,
          },
        };
      });
    },
    [setFormData, setSelectedFieldId, setSelectedSectionId],
  );

  const updateSection = React.useCallback(
    (sectionId: string, patch: Partial<FormSection>) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: sections.map((sec) => (sec.id === sectionId ? { ...sec, ...patch } : sec)),
          },
        };
      });
    },
    [setFormData],
  );

  const removeSection = React.useCallback(
    (sectionId: string) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: sections.filter((sec) => sec.id !== sectionId),
          },
        };
      });
      setSelectedSectionId(null);
    },
    [setFormData, setSelectedSectionId],
  );

  const reorderSections = React.useCallback(
    (activeId: string, overId: string, insertIndex?: number) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        const oldIndex = sections.findIndex((s) => s.id === activeId);
        if (oldIndex === -1) return prev;

        let newIndex = sections.findIndex((s) => s.id === overId);
        if (insertIndex !== undefined) {
          newIndex = insertIndex;
        }
        if (newIndex === -1 || oldIndex === newIndex) return prev;

        const newSections = [...sections];
        const [moved] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, moved);

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
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
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: sections.map((sec, idx) => {
              if (sec.id !== sectionId) return sec;
              if (targetZone === "tab") {
                const grpId = opts?.tabGroupId || `tabgrp_${idx + 1}`;
                const title = opts?.tabTitle || sec.title || `Tab ${idx + 1}`;
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
        };
      });
    },
    [setFormData],
  );

  return {
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    convertSectionZone,
  };
}
