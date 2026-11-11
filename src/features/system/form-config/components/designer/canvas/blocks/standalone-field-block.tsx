"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type * as React from "react";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { DesignerFieldCard } from "../designer-field-card";

export interface StandaloneFieldBlockProps {
  section: FormSection;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveSection: (id: string) => void;
  onRemoveField: (fieldId: string) => void;
  disabled?: boolean;
}

/**
 * Independent Standalone Field Block.
 * Renders an un-enclosed form field directly at the root canvas level.
 */
export function StandaloneFieldBlock({
  section,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onRemoveSection,
  onRemoveField,
  disabled,
}: StandaloneFieldBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section", section },
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const field = section.fields[0];

  if (!field) {
    return null;
  }

  const fieldId = field.SN || field.NAME;
  const isSelected = selectedFieldId === fieldId;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: canvas selectable standalone field
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection(section.id);
        onSelectField(section.id, fieldId);
      }}
      className={cn(
        "relative rounded-md transition-all select-none my-1 group",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      <div {...attributes} {...listeners}>
        <DesignerFieldCard
          field={field}
          sectionId={section.id}
          isSelected={isSelected}
          onSelect={() => {
            onSelectSection(section.id);
            onSelectField(section.id, fieldId);
          }}
          onRemove={() => {
            onRemoveField(fieldId);
            onRemoveSection(section.id);
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
