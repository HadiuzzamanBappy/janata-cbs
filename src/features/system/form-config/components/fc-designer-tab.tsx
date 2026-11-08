"use client";

import * as React from "react";
import { useContainerWidth } from "@/hooks";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
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
    containerType?: "card" | "plain" | "tab" | "step" | "accordion",
    initialFields?: FormElement[],
    customTitle?: string,
    groupId?: string,
    groupTitle?: string,
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
    targetType: "card" | "plain" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
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
  onMergeTabGroup,
  disabled,
}: FcDesignerTabProps) {
  const { ref: containerRef, isCompact } = useContainerWidth<HTMLDivElement>(960);
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);

  const activeSection =
    sections.find((s) => s.id === selectedSectionId) ||
    (selectedFieldId
      ? sections.find((s) =>
          (s.fields || []).some((f) => f.SN === selectedFieldId || f.NAME === selectedFieldId),
        ) || null
      : sections[0] || null);

  const activeField =
    sections
      .flatMap((s) => s.fields || [])
      .find((f) => f.SN === selectedFieldId || f.NAME === selectedFieldId) || null;

  const usedFieldNames = React.useMemo(() => {
    return new Set(sections.flatMap((s) => (s.fields || []).map((f) => f.NAME)));
  }, [sections]);

  const handlePaletteAddField = (template: Partial<FormElement>) => {
    if (isCompact) {
      setIsPaletteOpen(false);
    }

    if (selectedSectionId) {
      onAddFieldToSection(selectedSectionId, template);
      return;
    }

    const rootCanvasSection = sections.find(
      (s) => s.containerType === "plain" || !s.title || s.title === "Canvas Root",
    );

    if (rootCanvasSection) {
      onAddFieldToSection(rootCanvasSection.id, template);
      return;
    }

    const fieldName = template.NAME || `field_${(sections.length + 1).toString()}`;
    const newField: FormElement = {
      SN: template.SN || String(sections.length + 1),
      NAME: fieldName,
      LABEL: template.LABEL || "New Field",
      TYPE: template.TYPE || "Text",
      LENGTH: template.LENGTH ?? 35,
      STRUCTURE: template.STRUCTURE || "S",
      REQUIRED: Boolean(template.REQUIRED),
      DISABLED: template.DISABLED ?? false,
      WIDTH: template.WIDTH ?? "md",
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
      DEFAULTVALUE: template.DEFAULTVALUE || "",
    };

    onAddSection("plain", [newField], "");
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
      field?: FormElement;
      initialFields?: FormElement[];
      containerType?: "card" | "plain" | "tab" | "step" | "accordion";
      title?: string;
      groupId?: string;
      groupTitle?: string;
      columns?: number;
    };

    const droppedField = data.element || data.field;
    if ((data.type === "palette-variable" || data.type === "palette-field") && droppedField) {
      if (targetSectionId && targetSectionId !== "canvas-root") {
        onAddFieldToSection(targetSectionId, droppedField);
      } else if (insertIndex !== undefined) {
        onAddSection("plain", [droppedField], "", undefined, undefined, insertIndex, 1);
      } else {
        handlePaletteAddField(droppedField);
      }
      return;
    }

    if (data.type === "palette-container" && data.containerType) {
      const targetSec = targetSectionId ? sections.find((s) => s.id === targetSectionId) : null;
      if (
        targetSec &&
        targetSectionId !== "new-tab-in-group" &&
        data.initialFields &&
        data.initialFields.length > 0
      ) {
        for (const field of data.initialFields) {
          onAddFieldToSection(targetSec.id, field);
        }
        return;
      }

      const isTargetTabGroup =
        targetSectionId === "new-tab-in-group" || (targetSec && targetSec.containerType === "tab");
      const targetGroupId = isTargetTabGroup ? data.groupId || targetSec?.groupId : undefined;
      const effectiveGroupTitle = isTargetTabGroup
        ? data.title || data.groupTitle || "New Tab"
        : data.groupTitle;

      onAddSection(
        isTargetTabGroup ? "tab" : data.containerType,
        data.initialFields || [],
        data.title,
        targetGroupId,
        effectiveGroupTitle,
        insertIndex,
        data.columns,
      );
    }
  };

  const handleHighlightField = (fieldName: string) => {
    for (const sec of sections) {
      const match = (sec.fields || []).find((f) => f.NAME === fieldName || f.SN === fieldName);
      if (match) {
        onSelectSection(sec.id);
        onSelectField(match.SN || match.NAME);
        if (isCompact) {
          setIsPaletteOpen(false);
          setIsInspectorOpen(true);
        }
        break;
      }
    }
  };

  const handleCanvasSelectField = (sectionId: string | null, fieldId: string | null) => {
    if (sectionId) onSelectSection(sectionId);
    onSelectField(fieldId);
    if (isCompact && (fieldId || sectionId)) {
      setIsInspectorOpen(true);
      setIsPaletteOpen(false);
    }
  };

  const handleCanvasBackgroundClick = () => {
    const rootSection =
      sections.find((s) => s.containerType === "plain" || !s.title || s.title === "Canvas Root") ||
      sections.find((s) => s.containerType !== "tab") ||
      sections[0];
    if (rootSection) {
      onSelectSection(rootSection.id);
      onSelectField(null);
    }
  };

  const hasSelection = Boolean(selectedFieldId || selectedSectionId);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full w-full bg-background overflow-hidden"
    >
      {/* Backdrop for Left Palette Drawer on compact screens */}
      {isCompact && isPaletteOpen && (
        <div
          className="absolute inset-0 bg-black/40 z-30 backdrop-blur-xs transition-opacity"
          onClick={() => setIsPaletteOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Backdrop for Right Inspector Drawer on compact screens */}
      {isCompact && isInspectorOpen && (
        <div
          className="absolute inset-0 bg-black/40 z-30 backdrop-blur-xs transition-opacity"
          onClick={() => setIsInspectorOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* 1. Left: Palette (Side-panel on desktop, Drawer on compact) */}
        {isCompact ? (
          <div
            className={cn(
              "absolute inset-y-0 left-0 z-40 w-72 sm:w-80 shadow-2xl transition-transform duration-200 ease-in-out bg-card",
              isPaletteOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
            )}
          >
            <FieldPalette
              targetModel={targetModel}
              modelProperties={modelProperties}
              usedFieldNames={usedFieldNames}
              onHighlightField={handleHighlightField}
              onAddField={handlePaletteAddField}
              onAddSection={(...args) => {
                onAddSection(...args);
                if (isCompact) setIsPaletteOpen(false);
              }}
              onClose={() => setIsPaletteOpen(false)}
              disabled={disabled}
              className="w-full h-full border-r border-border"
            />
          </div>
        ) : (
          <FieldPalette
            targetModel={targetModel}
            modelProperties={modelProperties}
            usedFieldNames={usedFieldNames}
            onHighlightField={handleHighlightField}
            onAddField={handlePaletteAddField}
            onAddSection={onAddSection}
            disabled={disabled}
          />
        )}

        {/* 2. Center: Canvas */}
        <DesignerCanvas
          sections={sections}
          selectedSectionId={selectedSectionId}
          selectedFieldId={selectedFieldId}
          onSelectSection={(id) => {
            onSelectSection(id);
            onSelectField(null);
            if (isCompact && id) {
              setIsInspectorOpen(true);
              setIsPaletteOpen(false);
            }
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
          onClickBackground={handleCanvasBackgroundClick}
          onMergeTabGroup={onMergeTabGroup}
          disabled={disabled}
          isCompact={isCompact}
          isPaletteOpen={isPaletteOpen}
          isInspectorOpen={isInspectorOpen}
          hasSelection={hasSelection}
          onTogglePalette={() => {
            setIsPaletteOpen((prev) => !prev);
            setIsInspectorOpen(false);
          }}
          onToggleInspector={() => {
            setIsInspectorOpen((prev) => !prev);
            setIsPaletteOpen(false);
          }}
        />

        {/* 3. Right: Property Inspector (Side-panel on desktop, Drawer on compact) */}
        {isCompact ? (
          <div
            className={cn(
              "absolute inset-y-0 right-0 z-40 w-72 sm:w-80 shadow-2xl transition-transform duration-200 ease-in-out bg-card",
              isInspectorOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
            )}
          >
            <PropertyInspector
              selectedSection={activeSection}
              selectedField={activeField}
              modelProperties={modelProperties}
              onUpdateSection={(patch) => activeSection && onUpdateSection(activeSection.id, patch)}
              onUpdateField={(patch) => {
                const targetId = activeField?.SN || activeField?.NAME;
                if (targetId) onUpdateField(targetId, patch);
              }}
              onClose={() => {
                setIsInspectorOpen(false);
              }}
              onDeselectField={() => onSelectField(null)}
              disabled={disabled}
              className="w-full h-full border-l border-border"
            />
          </div>
        ) : (
          <PropertyInspector
            selectedSection={activeSection}
            selectedField={activeField}
            modelProperties={modelProperties}
            onUpdateSection={(patch) => activeSection && onUpdateSection(activeSection.id, patch)}
            onUpdateField={(patch) => {
              const targetId = activeField?.SN || activeField?.NAME;
              if (targetId) onUpdateField(targetId, patch);
            }}
            onClose={() => {
              onSelectSection(null);
              onSelectField(null);
            }}
            onDeselectField={() => onSelectField(null)}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
