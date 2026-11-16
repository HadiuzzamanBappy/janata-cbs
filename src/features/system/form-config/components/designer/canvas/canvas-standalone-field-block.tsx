/**
 * @fileoverview Standalone (untitled, root-level) single-field block for the Form Designer canvas.
 *
 * @module features/system/form-config/components/designer/canvas/canvas-standalone-field-block
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type * as React from "react";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-engine-schema";
import { useDesignerContext } from "../context/designer-context";
import { CanvasFieldCard } from "./canvas-field-card";

export interface StandaloneFieldBlockProps {
  section: FormSection;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveSection?: (id: string) => void;
  onRemoveField?: (fieldId: string) => void;
  disabled?: boolean;
}

/**
 * Independent Standalone Field Block.
 * Renders an un-enclosed form field directly at the root canvas level.
 */
export function StandaloneFieldBlock(props: StandaloneFieldBlockProps) {
  const context = useDesignerContext();
  const { section } = props;
  const selectedFieldId =
    props.selectedFieldId !== undefined ? props.selectedFieldId : context.selectedFieldId;
  const onSelectSection = props.onSelectSection ?? context.handleCanvasSelectSection;
  const onSelectField = props.onSelectField ?? context.handleCanvasSelectField;
  const onRemoveSection = props.onRemoveSection ?? context.onRemoveSection;
  const onRemoveField = props.onRemoveField ?? context.onRemoveField;
  const disabled = props.disabled ?? context.disabled;

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
  if (!field) return null;

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
        "relative rounded-md transition-all select-none first:mt-0 my-1 group",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      <div {...attributes} {...listeners}>
        <CanvasFieldCard
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
