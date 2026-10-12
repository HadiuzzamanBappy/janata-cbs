"use client";

import * as React from "react";
import type { FormSection, FormWidgetType } from "@/lib/data-schemas/form-config-schema";
import { DesignerCanvas } from "./designer/designer-canvas";
import { FieldPalette } from "./designer/field-palette";
import { PropertyInspector } from "./designer/property-inspector";

export interface FcDesignerTabProps {
  targetModel?: string;
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (id: string | null) => void;
  onAddSection: (
    type: "standard" | "object-group" | "array-table",
    zone?: "header" | "tab" | "standard",
  ) => void;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onAddFieldToSection: (sectionId: string, template?: Record<string, unknown>) => void;
  onUpdateField: (fieldId: string, patch: Record<string, unknown>) => void;
  onRemoveField: (fieldId: string) => void;
  onReorderFields: (sectionId: string, activeId: string, overId: string) => void;
  onReorderSections?: (activeId: string, overId: string) => void;
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
  onReorderSections,
  disabled,
}: FcDesignerTabProps) {
  const activeSection = sections.find((s) => s.id === selectedSectionId) || null;
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
  }) => {
    // If no section is selected, add to the first section or create one
    if (sections.length === 0) {
      onAddSection("standard");
      return;
    }
    const targetSecId = selectedSectionId || sections[0].id;
    onAddFieldToSection(targetSecId, template);
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
          onSelectField={(id) => {
            onSelectField(id);
          }}
          onUpdateSection={onUpdateSection}
          onRemoveSection={onRemoveSection}
          onRemoveField={onRemoveField}
          onReorderFields={onReorderFields}
          onReorderSections={onReorderSections}
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
          disabled={disabled}
        />
      </div>
    </div>
  );
}
