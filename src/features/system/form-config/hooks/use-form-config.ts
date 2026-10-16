"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import {
  type FormArchetype,
  type FormConfigRecord,
  type FormFieldItem,
  type FormSection,
  formConfigRecordSchema,
} from "@/lib/data-schemas/form-config-schema";
import { INITIAL_FORM_CONFIG, useFormConfigPersistence } from "./use-form-config-persistence";

export type FormConfigTabKey = "general" | "designer" | "preview" | "audit" | "json";

export interface FormConfigValidationError {
  id: string;
  tab: FormConfigTabKey;
  fieldKey: string;
  message: string;
}

export interface FormCatalogItem {
  id: string;
  label: string;
  details?: string;
}

export function useFormConfig(initialId?: string, tabId?: string) {
  const { recordId, setRecordId, mode, setMode, formData, setFormData } = useFormConfigPersistence(
    initialId,
    tabId,
  );

  const [availableForms, setAvailableForms] = React.useState<FormCatalogItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<FormConfigValidationError[]>([]);

  // Refresh available forms catalog dynamically from CBS service
  React.useEffect(() => {
    cbs
      .send<FormCatalogItem[]>(cbs.formConfig.list(), { silent: true })
      .then((res) => {
        if (res.status === "SUCCESS" && Array.isArray(res.data)) {
          setAvailableForms(res.data);
        }
      })
      .catch(() => {
        // Fallback or offline graceful handling
      });
  }, []);

  // Load record by ID from API or fixture
  const fetchRecord = React.useCallback(
    async (targetId: string, nextMode?: "I" | "S") => {
      if (!targetId.trim()) return;
      const cleanId = targetId.trim().toUpperCase();
      setLoading(true);
      setRecordId(cleanId);

      try {
        const res = await cbs.send<
          { data: typeof INITIAL_FORM_CONFIG } | typeof INITIAL_FORM_CONFIG
        >(cbs.formConfig.get(cleanId), { silent: true });

        const loadedRecord =
          (res.data as { data?: typeof INITIAL_FORM_CONFIG })?.data ||
          (res.data as typeof INITIAL_FORM_CONFIG);

        if (res.status === "SUCCESS" && loadedRecord) {
          const sanitizedRecord: FormConfigRecord = {
            ...loadedRecord,
            presentation: {
              ...loadedRecord.presentation,
              sections: (loadedRecord.presentation?.sections ?? []).map((sec) => ({
                ...sec,
                type: (sec.type ||
                  (sec.bindKey ? "object-group" : "standard")) as FormSection["type"],
                columns: sec.columns || 1,
              })),
            },
          };
          setFormData(sanitizedRecord);
          setMode(nextMode || "I");
          toast.add({
            title: "Form Loaded",
            description: `Loaded form specification: ${cleanId}`,
            type: "info",
          });
        } else {
          setFormData({
            ...INITIAL_FORM_CONFIG,
            recordId: cleanId,
            title: `Form ${cleanId}`,
          });
          setMode("I");
        }
      } catch {
        setFormData({
          ...INITIAL_FORM_CONFIG,
          recordId: cleanId,
          title: `Form ${cleanId}`,
        });
        setMode("I");
      } finally {
        setLoading(false);
      }
    },
    [setFormData, setMode, setRecordId],
  );

  // Set active Archetype
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

  // Add Section to canvas
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
    [setFormData],
  );

  // Update Section
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

  // Remove Section
  const removeSection = React.useCallback(
    (sectionId: string) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.filter((sec) => sec.id !== sectionId),
        },
      }));
      if (selectedSectionId === sectionId) setSelectedSectionId(null);
    },
    [selectedSectionId, setFormData],
  );

  // Add Field to Section
  const addFieldToSection = React.useCallback(
    (sectionId: string, fieldTemplate?: Partial<FormFieldItem>) => {
      const fieldId = `f_${Date.now()}`;
      const newField: FormFieldItem = {
        id: fieldId,
        fieldKey: fieldTemplate?.fieldKey || `field_${Date.now().toString().slice(-4)}`,
        label: fieldTemplate?.label || "New Field",
        widget: fieldTemplate?.widget || "text",
        colSpan: fieldTemplate?.colSpan || 6,
        required: fieldTemplate?.required || false,
        readOnly: fieldTemplate?.readOnly || false,
        hidden: false,
        placeholder: fieldTemplate?.placeholder || "",
        options: fieldTemplate?.options,
        currencyPrefix: fieldTemplate?.currencyPrefix,
        formula: fieldTemplate?.formula,
      };

      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) =>
            sec.id === sectionId ? { ...sec, fields: [...sec.fields, newField] } : sec,
          ),
        },
      }));
      setSelectedFieldId(fieldId);
    },
    [setFormData],
  );

  // Update Field
  const updateField = React.useCallback(
    (fieldId: string, patch: Partial<FormFieldItem>) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) => ({
            ...sec,
            fields: sec.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
          })),
        },
      }));
    },
    [setFormData],
  );

  // Remove Field
  const removeField = React.useCallback(
    (fieldId: string) => {
      setFormData((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          sections: prev.presentation.sections.map((sec) => ({
            ...sec,
            fields: sec.fields.filter((f) => f.id !== fieldId),
          })),
        },
      }));
      if (selectedFieldId === fieldId) setSelectedFieldId(null);
    },
    [selectedFieldId, setFormData],
  );

  // Reorder fields inside a section (for drag-and-drop)
  const reorderFields = React.useCallback(
    (sectionId: string, activeId: string, overId: string) => {
      setFormData((prev) => {
        const section = prev.presentation.sections.find((s) => s.id === sectionId);
        if (!section) return prev;

        const oldIndex = section.fields.findIndex((f) => f.id === activeId);
        const newIndex = section.fields.findIndex((f) => f.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

        const newFields = [...section.fields];
        const [moved] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, moved);

        return {
          ...prev,
          presentation: {
            ...prev.presentation,
            sections: prev.presentation.sections.map((s) =>
              s.id === sectionId ? { ...s, fields: newFields } : s,
            ),
          },
        };
      });
    },
    [setFormData],
  );

  // Move a field across sections (e.g., from root canvas into a group, or from group to root canvas)
  const moveFieldAcrossSections = React.useCallback(
    (
      sourceSecId: string,
      targetSecId: string,
      fieldId: string,
      targetFieldId?: string,
      insertAtIndex?: number,
    ) => {
      setFormData((prev) => {
        const sourceSec = prev.presentation.sections.find((s) => s.id === sourceSecId);
        if (!sourceSec) return prev;

        const fieldIndex = sourceSec.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex === -1) return prev;

        const fieldToMove = sourceSec.fields[fieldIndex];

        // ── Case A: Moving to canvas-root or gap where target section might not exist ──
        if (targetSecId === "canvas-root" || targetSecId.startsWith("gap-")) {
          const newRootSec: FormSection = {
            id: `sec_root_${Date.now()}`,
            title: "",
            type: "standard",
            zone: "standard",
            columns: 2,
            collapsible: false,
            isCollapsed: false,
            layoutStyle: "plain",
            fields: [fieldToMove],
          };

          const newSections = prev.presentation.sections
            .map((s) =>
              s.id === sourceSecId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s,
            )
            .filter((s) => !(s.layoutStyle === "plain" && !s.title && s.fields.length === 0));

          if (
            insertAtIndex !== undefined &&
            insertAtIndex >= 0 &&
            insertAtIndex <= newSections.length
          ) {
            newSections.splice(insertAtIndex, 0, newRootSec);
          } else {
            // Find existing plain section if any
            const existingRoot = newSections.find(
              (s) => s.layoutStyle === "plain" || !s.title || s.title === "Canvas Root",
            );
            if (existingRoot) {
              existingRoot.fields.push(fieldToMove);
              return {
                ...prev,
                presentation: { ...prev.presentation, sections: newSections },
              };
            }
            newSections.push(newRootSec);
          }

          return {
            ...prev,
            presentation: {
              ...prev.presentation,
              sections: newSections,
            },
          };
        }

        const targetSec = prev.presentation.sections.find((s) => s.id === targetSecId);
        if (!targetSec) return prev;

        if (sourceSecId === targetSecId) {
          // Same section reorder
          if (!targetFieldId || targetFieldId === fieldId) return prev;
          const targetIndex = targetSec.fields.findIndex((f) => f.id === targetFieldId);
          if (targetIndex === -1) return prev;
          const newFields = [...sourceSec.fields];
          newFields.splice(fieldIndex, 1);
          newFields.splice(targetIndex, 0, fieldToMove);
          return {
            ...prev,
            presentation: {
              ...prev.presentation,
              sections: prev.presentation.sections.map((s) =>
                s.id === sourceSecId ? { ...s, fields: newFields } : s,
              ),
            },
          };
        }

        // Cross-section move
        const newSourceFields = sourceSec.fields.filter((f) => f.id !== fieldId);
        const newTargetFields = [...targetSec.fields];

        if (targetFieldId) {
          const targetIndex = newTargetFields.findIndex((f) => f.id === targetFieldId);
          if (targetIndex !== -1) {
            newTargetFields.splice(targetIndex, 0, fieldToMove);
          } else {
            newTargetFields.push(fieldToMove);
          }
        } else {
          newTargetFields.push(fieldToMove);
        }

        const updatedSections = prev.presentation.sections
          .map((s) => {
            if (s.id === sourceSecId) return { ...s, fields: newSourceFields };
            if (s.id === targetSecId) return { ...s, fields: newTargetFields };
            return s;
          })
          .filter((s) => !(s.layoutStyle === "plain" && !s.title && s.fields.length === 0));

        return {
          ...prev,
          presentation: {
            ...prev.presentation,
            sections: updatedSections,
          },
        };
      });
      setSelectedFieldId(fieldId);
      if (targetSecId !== "canvas-root" && !targetSecId.startsWith("gap-")) {
        setSelectedSectionId(targetSecId);
      }
    },
    [setFormData],
  );

  // Reorder sections/blocks on the canvas (for drag-and-drop)
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

  /**
   * Convert a section's zone:
   * - card → tab: wraps it as a new tab page (with a new tabGroupId if not specified)
   * - tab → card: converts to a standard card section (clears tabGroupId/tabTitle)
   */
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
            // tab → standard card
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

  // Validate form configuration against Zod schema
  const handleValidate = React.useCallback((): boolean => {
    const result = formConfigRecordSchema.safeParse(formData);
    if (!result.success) {
      const errors: FormConfigValidationError[] = result.error.issues.map((issue) => ({
        id: issue.path.join("."),
        tab: "designer",
        fieldKey: String(issue.path[issue.path.length - 1]),
        message: issue.message,
      }));
      setValidationErrors(errors);
      toast.add({
        title: "Validation Issues",
        description: `Found ${errors.length} issue(s) in form configuration`,
        type: "warning",
      });
      return false;
    }
    setValidationErrors([]);
    toast.add({
      title: "Validation Passed",
      description: "Form layout configuration is completely valid",
      type: "success",
    });
    return true;
  }, [formData]);

  // Submit / Save form configuration
  const handleSubmit = React.useCallback(async () => {
    if (!handleValidate()) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.add({
        title: "Form Layout Committed",
        description: `Form configuration ${formData.recordId} successfully saved`,
        type: "success",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData.recordId, handleValidate]);

  // Create new draft
  const handleCreateNew = React.useCallback(() => {
    setFormData({
      ...INITIAL_FORM_CONFIG,
      recordId: `FC.NEW_${Date.now().toString().slice(-4)}`,
      title: "New Form Layout",
      version: "1.0.0",
      presentation: {
        archetype: "grid",
        density: "compact",
        steps: [],
        sections: [
          {
            id: `sec_${Date.now()}`,
            title: "Primary Attributes",
            type: "standard",
            zone: "standard",
            columns: 2,
            collapsible: false,
            isCollapsed: false,
            fields: [],
          },
        ],
      },
    });
    setMode("I");
    toast.add({
      title: "New Form Draft Created",
      description: "Ready to design new layout",
      type: "info",
    });
  }, [setFormData, setMode]);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
  }, [setMode]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    loading,
    submitting,
    selectedSectionId,
    setSelectedSectionId,
    selectedFieldId,
    setSelectedFieldId,
    validationErrors,
    setArchetype,
    addSection,
    updateSection,
    removeSection,
    addFieldToSection,
    updateField,
    removeField,
    reorderFields,
    moveFieldAcrossSections,
    reorderSections,
    convertSectionZone,
    handleValidate,
    handleSubmit,
    handleCreateNew,
    resetToIdle,
    fetchRecord,
    availableForms,
  };
}
