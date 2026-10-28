"use client";

import * as React from "react";
import type { FormElement, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { DesignerCanvas } from "./designer/designer-canvas";
import { FieldPalette } from "./designer/field-palette";
import { PropertyInspector } from "./designer/property-inspector";

export interface FcDesignerTabProps {
  targetModel?: string;
  modelProperties?: ModelProperty[];
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (id: string | null) => void;
  onAddSection: (
    type: "standard" | "object-group" | "array-table",
    zone?: "header" | "tab" | "standard",
    initialFields?: FormElement[],
    layoutStyle?: "card" | "plain",
    customTitle?: string,
    tabGroupId?: string,
    tabTitle?: string,
    insertIndex?: number,
    columns?: number,
  ) => void;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onAddFieldToSection: (sectionId: string, template?: Partial<FormElement>) => void;
  onUpdateField: (fieldId: string, patch: Partial<FormElement>) => void;
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
  modelProperties,
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
  const activeSection =
    sections.find((s) => s.id === selectedSectionId) ||
    (selectedFieldId
      ? sections.find((s) =>
          (s.fields || []).some(
            (f) =>
              f.id === selectedFieldId || f.NAME === selectedFieldId || f.SN === selectedFieldId,
          ),
        ) || null
      : sections[0] || null);

  const activeField =
    sections
      .flatMap((s) => s.fields || [])
      .find(
        (f) => f.id === selectedFieldId || f.NAME === selectedFieldId || f.SN === selectedFieldId,
      ) || null;

  const usedFieldNames = React.useMemo(() => {
    return new Set(sections.flatMap((s) => (s.fields || []).map((f) => f.NAME)));
  }, [sections]);

  const handlePaletteAddField = (template: Partial<FormElement>) => {
    if (selectedSectionId) {
      onAddFieldToSection(selectedSectionId, template);
      return;
    }

    const rootCanvasSection = sections.find(
      (s) => s.layoutStyle === "plain" || !s.title || s.title === "Canvas Root",
    );

    if (rootCanvasSection) {
      onAddFieldToSection(rootCanvasSection.id, template);
      return;
    }

    const fieldName = template.NAME || `field_${(sections.length + 1).toString()}`;
    const newField: FormElement = {
      id: template.id || fieldName,
      SN: template.SN || String(sections.length + 1),
      NAME: fieldName,
      LABEL: template.LABEL || "New Field",
      TYPE: template.TYPE || "Text",
      LENGTH: template.LENGTH ?? 35,
      STRUCTURE: template.STRUCTURE || "S",
      REQUIRED: template.REQUIRED ?? false,
      DISABLED: template.DISABLED ?? false,
      WIDTH: template.WIDTH ?? 200,
      POSITION: template.POSITION || "",
      PARAMETER: template.PARAMETER || {
        type: "O",
        data: [],
        modelName: "",
        displayField: "",
        condition: "",
        reference: "",
      },
      ENRICHTEXT: template.ENRICHTEXT || "",
      VALUE: template.VALUE || "",
      FIXEDVALUE: template.FIXEDVALUE || "",
      ISOPEN: template.ISOPEN ?? false,
      ISLOADING: template.ISLOADING ?? false,
      PROP: template.PROP || [],
      DATASOURCE: template.DATASOURCE || [],
      DEFAULTVALUE: template.DEFAULTVALUE || "",
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

  const handleHighlightField = (fieldName: string) => {
    for (const sec of sections) {
      const match = (sec.fields || []).find(
        (f) => f.NAME === fieldName || f.id === fieldName || f.SN === fieldName,
      );
      if (match) {
        onSelectSection(sec.id);
        onSelectField(match.id || match.NAME || match.SN);
        break;
      }
    }
  };

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
      element?: FormElement;
      containerType?: "standard" | "object-group" | "array-table";
      zone?: "header" | "tab" | "standard";
      layoutStyle?: "card" | "plain";
      title?: string;
      tabGroupId?: string;
      tabTitle?: string;
      columns?: number;
    };

    if (data.type === "palette-variable" && data.element) {
      if (targetSectionId && targetSectionId !== "canvas-root") {
        onAddFieldToSection(targetSectionId, data.element);
      } else if (insertIndex !== undefined) {
        onAddSection(
          "standard",
          "standard",
          [data.element],
          "plain",
          "",
          undefined,
          undefined,
          insertIndex,
          1,
        );
      } else {
        handlePaletteAddField(data.element);
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
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Palette */}
        <FieldPalette
          targetModel={targetModel}
          modelProperties={modelProperties}
          usedFieldNames={usedFieldNames}
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
          onUpdateField={(patch) => {
            const targetId = activeField?.id || activeField?.NAME || activeField?.SN;
            if (targetId) onUpdateField(targetId, patch);
          }}
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
