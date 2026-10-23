"use client";
import * as React from "react";
import type {
  FormFieldItem,
  FormSection,
  FormWidgetType,
} from "@/lib/data-schemas/form-config-schema";
import { DesignerCanvas } from "./designer/designer-canvas";
import { FieldPalette } from "./designer/field-palette";
import { PropertyInspector } from "./designer/property-inspector";

export interface FcDesignerTabProps {
  targetModel?: string;
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (id: string | null) => void; // kept as single-arg for the parent hook
  onAddSection: (
    type: "standard" | "object-group" | "array-table",
    zone?: "header" | "tab" | "standard",
    initialFields?: FormFieldItem[],
    layoutStyle?: "card" | "plain",
    customTitle?: string,
    tabGroupId?: string,
    tabTitle?: string,
    insertIndex?: number,
    columns?: number,
  ) => void;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onAddFieldToSection: (sectionId: string, template?: Record<string, unknown>) => void;
  onUpdateField: (fieldId: string, patch: Record<string, unknown>) => void;
  onRemoveField: (fieldId: string) => void;
  onReorderFields: (sectionId: string, activeId: string, overId: string) => void;
  onMoveFieldAcrossSections?: (
    sourceSecId: string,
    targetSecId: string,
    fieldId: string,
    targetFieldId?: string,
    insertAtIndex?: number,
  ) => void;
  onReorderSections?: (activeId: string, overId: string, insertIndex?: number) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  disabled?: boolean;
}

export function FcDesignerTab({
  targetModel,
  sections,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onAddFieldToSection,
  onUpdateField,
  onRemoveField,
  onReorderFields,
  onMoveFieldAcrossSections,
  onReorderSections,
  onConvertSectionZone,
  disabled,
}: FcDesignerTabProps) {
  // Always default to the first/root container section if no section or field is explicitly selected
  const activeSection =
    sections.find((s) => s.id === selectedSectionId) ||
    (selectedFieldId
      ? sections.find((s) => s.fields.some((f) => f.id === selectedFieldId)) || null
      : sections[0] || null);

  const activeField =
    sections.flatMap((s) => s.fields).find((f) => f.id === selectedFieldId) || null;

  // Track all fieldKeys currently used on the canvas
  const usedFieldKeys = React.useMemo(() => {
    return new Set(sections.flatMap((s) => s.fields.map((f) => f.fieldKey)));
  }, [sections]);

  const handlePaletteAddField = (template: {
    label: string;
    widget: FormWidgetType;
    colSpan: number;
    fieldKey?: string;
    currencyPrefix?: string;
    options?: string[];
    modelType?: string;
    parameter?: unknown;
  }) => {
    // 1. If user selected a specific container/section, add directly to that container!
    if (selectedSectionId) {
      onAddFieldToSection(selectedSectionId, template);
      return;
    }

    // 2. If no section selected (or user clicked outside on canvas):
    // Check if an existing plain root canvas section exists
    const rootCanvasSection = sections.find(
      (s) => s.layoutStyle === "plain" || !s.title || s.title === "Canvas Root",
    );

    if (rootCanvasSection) {
      // Add variable directly onto existing canvas root
      onAddFieldToSection(rootCanvasSection.id, template);
      return;
    }

    // 3. Otherwise create a plain root canvas section directly with this variable (no card wrapper, no header)
    const fieldId = `f_${Date.now()}`;
    const newField: FormFieldItem = {
      id: fieldId,
      fieldKey: template.fieldKey || `field_${Date.now().toString().slice(-4)}`,
      label: template.label,
      widget: template.widget,
      colSpan: template.colSpan,
      required: false,
      readOnly: false,
      hidden: false,
      options: template.options,
      currencyPrefix: template.currencyPrefix,
      modelType: template.modelType,
      parameter: template.parameter,
    };
    onAddSection(
      "standard",
      "standard",
      [newField],
      "plain",
      "",
      undefined,
      undefined,
      undefined,
      1,
    );
  };

  const handleHighlightField = (fieldKey: string) => {
    for (const sec of sections) {
      const match = sec.fields.find((f) => f.fieldKey === fieldKey);
      if (match) {
        onSelectSection(sec.id);
        onSelectField(match.id);
        break;
      }
    }
  };

  /**
   * Canvas uses (sectionId | null, fieldId | null) so the section can be
   * activated in the same call, preventing it being cleared by subsequent events.
   */
  const handleCanvasSelectField = (sectionId: string | null, fieldId: string | null) => {
    if (sectionId) onSelectSection(sectionId);
    onSelectField(fieldId);
  };

  const handleDropPaletteItem = (
    payload: unknown,
    targetSectionId?: string,
    insertIndex?: number,
  ) => {
    if (!payload || typeof payload !== "object") return;
    const data = payload as {
      type?: string;
      template?: {
        label: string;
        widget: FormWidgetType;
        colSpan: number;
        fieldKey?: string;
        currencyPrefix?: string;
        options?: string[];
        modelType?: string;
        parameter?: unknown;
      };
      containerType?: "standard" | "object-group" | "array-table";
      zone?: "header" | "tab" | "standard";
      layoutStyle?: "card" | "plain";
      title?: string;
      tabGroupId?: string;
      tabTitle?: string;
      columns?: number;
    };

    if (data.type === "palette-variable" && data.template) {
      if (targetSectionId && targetSectionId !== "canvas-root") {
        onAddFieldToSection(targetSectionId, data.template);
      } else if (insertIndex !== undefined) {
        const fieldId = `f_${Date.now()}`;
        const newField: FormFieldItem = {
          id: fieldId,
          fieldKey: data.template.fieldKey || `field_${Date.now().toString().slice(-4)}`,
          label: data.template.label,
          widget: data.template.widget,
          colSpan: data.template.colSpan,
          required: false,
          readOnly: false,
          hidden: false,
          options: data.template.options,
          currencyPrefix: data.template.currencyPrefix,
          modelType: data.template.modelType,
          parameter: data.template.parameter,
        };
        onAddSection(
          "standard",
          "standard",
          [newField],
          "plain",
          "",
          undefined,
          undefined,
          insertIndex,
          1,
        );
      } else {
        handlePaletteAddField(data.template);
      }
    } else if (data.type === "palette-container" && data.containerType) {
      onAddSection(
        data.containerType,
        data.zone || "standard",
        [],
        data.layoutStyle || "card",
        data.title,
        data.tabGroupId,
        data.tabTitle,
        insertIndex,
        data.columns,
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* 3-Column Designer Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Palette */}
        <FieldPalette
          targetModel={targetModel}
          usedFieldKeys={usedFieldKeys}
          onHighlightField={handleHighlightField}
          onAddField={handlePaletteAddField}
          onAddSection={onAddSection}
          disabled={disabled}
        />

        {/* Center: Canvas */}
        <DesignerCanvas
          sections={sections}
          selectedSectionId={selectedSectionId}
          selectedFieldId={selectedFieldId}
          onSelectSection={(id) => {
            onSelectSection(id);
            onSelectField(null);
          }}
          onSelectField={handleCanvasSelectField}
          onAddSection={onAddSection}
          onUpdateSection={onUpdateSection}
          onRemoveSection={onRemoveSection}
          onRemoveField={onRemoveField}
          onReorderFields={onReorderFields}
          onMoveFieldAcrossSections={onMoveFieldAcrossSections}
          onReorderSections={onReorderSections}
          onConvertSectionZone={onConvertSectionZone}
          onDropPaletteItem={handleDropPaletteItem}
          disabled={disabled}
        />

        {/* Right: Property Inspector */}
        <PropertyInspector
          selectedSection={activeSection}
          selectedField={activeField}
          onUpdateSection={(patch) => activeSection && onUpdateSection(activeSection.id, patch)}
          onUpdateField={(patch) => activeField && onUpdateField(activeField.id, patch)}
          onClose={() => {
            onSelectSection(null);
            onSelectField(null);
          }}
          onDeselectField={() => onSelectField(null)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
