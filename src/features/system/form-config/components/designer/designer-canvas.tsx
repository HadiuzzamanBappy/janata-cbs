"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, Folder, GripVertical, Trash2 } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { DesignerFieldCard } from "./designer-field-card";

export interface DesignerCanvasProps {
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string) => void;
  onSelectField: (id: string) => void;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onRemoveField: (fieldId: string) => void;
  onReorderFields: (sectionId: string, activeId: string, overId: string) => void;
  onReorderSections?: (activeId: string, overId: string) => void;
  disabled?: boolean;
}

interface SortableSectionCardProps {
  section: FormSection;
  isSecSelected: boolean;
  selectedFieldId: string | null;
  onSelectSection: (id: string) => void;
  onSelectField: (id: string) => void;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onRemoveField: (fieldId: string) => void;
  onReorderFields: (sectionId: string, activeId: string, overId: string) => void;
  disabled?: boolean;
}

function SortableSectionCard({
  section,
  isSecSelected,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onUpdateSection,
  onRemoveSection,
  onRemoveField,
  onReorderFields,
  disabled,
}: SortableSectionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isGroup = section.type === "object-group";
  const isTable = section.type === "array-table";
  const isPlain = section.layoutStyle === "plain";

  const fieldSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderFields(section.id, String(active.id), String(over.id));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded transition-all overflow-hidden",
        isPlain
          ? "border border-dashed border-border/80 bg-background/50 p-1"
          : "border border-border/80 bg-card/60",
        isSecSelected && "border-primary/80 ring-1 ring-primary/30",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* Section Header Strip with Drag Handle */}
      <div
        className={cn(
          "px-2.5 py-1.5 flex items-center justify-between text-xs",
          isPlain
            ? "bg-muted/10 border-b border-dashed border-border/60"
            : "bg-muted/20 border-b border-border/60",
          isSecSelected && "bg-primary/5",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Section Drag Handle */}
          {!disabled && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground/50 hover:text-foreground shrink-0 p-0.5"
              aria-label="Reorder section block"
            >
              <GripVertical className="size-3.5 text-muted-foreground/60" />
            </button>
          )}

          {section.collapsible && (
            <button
              type="button"
              onClick={() => {
                onUpdateSection(section.id, { isCollapsed: !section.isCollapsed });
              }}
              className="text-muted-foreground hover:text-foreground p-0.5"
              aria-label={section.isCollapsed ? "Expand section" : "Collapse section"}
            >
              {section.isCollapsed ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectSection(section.id)}
            className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer text-left min-w-0"
          >
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">
              {section.title}
            </span>

            {isPlain ? (
              <Badge
                variant="outline"
                className="text-[9px] h-4 px-1.5 font-mono uppercase border-amber-500/40 text-amber-500 bg-amber-500/10"
              >
                PLAIN BLOCK
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] h-4 px-1.5 font-mono uppercase",
                  section.zone === "tab"
                    ? "border-sky-500/40 text-sky-500 bg-sky-500/10"
                    : "border-border text-muted-foreground",
                )}
              >
                {section.zone === "tab" ? `TAB: ${section.tabTitle || section.title}` : "CARD"}
              </Badge>
            )}

            <Badge
              variant="outline"
              className={cn(
                "text-[9px] h-4 px-1.5 font-mono uppercase",
                isGroup && "border-purple-500/40 text-purple-400 bg-purple-500/10",
                isTable && "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
              )}
            >
              {section.type}
            </Badge>

            {section.bindKey && (
              <span className="text-[10px] font-mono text-muted-foreground/70">
                &rarr; {section.bindKey}
              </span>
            )}
          </button>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSection(section.id);
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Section Body (Sortable Fields) */}
      {!section.isCollapsed && (
        <div className="p-2">
          {section.fields.length === 0 ? (
            <div className="p-3 text-center border border-dashed border-border/50 rounded text-[11px] text-muted-foreground/60">
              No fields placed yet. Select fields from the left Model Schema palette to place them
              here.
            </div>
          ) : (
            <DndContext
              sensors={fieldSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext
                items={section.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-1.5">
                  {section.fields.map((field) => (
                    <DesignerFieldCard
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      onSelect={() => onSelectField(field.id)}
                      onRemove={() => onRemoveField(field.id)}
                      disabled={disabled}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

export function DesignerCanvas({
  sections,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onUpdateSection,
  onRemoveSection,
  onRemoveField,
  onReorderFields,
  onReorderSections,
  disabled,
}: DesignerCanvasProps) {
  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderSections) {
      onReorderSections(String(active.id), String(over.id));
    }
  };

  if (sections.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/60 rounded-lg m-3 bg-muted/10">
        <Folder className="size-8 text-muted-foreground/50 mb-2" />
        <h4 className="text-xs font-semibold text-foreground">Canvas is Empty</h4>
        <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
          Add a Standard Card, Plain Block, or Object Group from the left palette to start building
          this form.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 select-none">
      <DndContext
        sensors={sectionSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {sections.map((section) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                isSecSelected={selectedSectionId === section.id}
                selectedFieldId={selectedFieldId}
                onSelectSection={onSelectSection}
                onSelectField={onSelectField}
                onUpdateSection={onUpdateSection}
                onRemoveSection={onRemoveSection}
                onRemoveField={onRemoveField}
                onReorderFields={onReorderFields}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
