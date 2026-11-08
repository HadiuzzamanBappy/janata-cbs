"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Layers, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { AddSectionFn } from "./canvas/canvas-types";
import { TabDropBody } from "./tab-group/tab-drop-body";

export interface SortableStepperGroupCardProps {
  groupId: string;
  stepSections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onRemoveField: (fieldId: string) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetType: "card" | "plain" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  disabled?: boolean;
}

/**
 * Visual Designer card for sequential Step/Wizard groups.
 * Reuses TabDropBody for field editing and layout parity.
 */
export function SortableStepperGroupCard({
  groupId,
  stepSections,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onAddSection,
  onRemoveSection,
  onRemoveField,
  onConvertSectionZone,
  onDropPaletteItem,
  disabled,
}: SortableStepperGroupCardProps) {
  const firstSection = stepSections[0];
  const [activeStepIdState, setActiveStepIdState] = React.useState<string>(firstSection?.id || "");

  const selectedStepInGroup = stepSections.find((s) => s.id === selectedSectionId);
  const activeSection =
    selectedStepInGroup || stepSections.find((s) => s.id === activeStepIdState) || stepSections[0];
  const activeStepId = activeSection?.id || "";

  const primaryId = firstSection ? firstSection.id : groupId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: primaryId,
    data: { type: "section", section: firstSection },
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isAnyStepSelected = stepSections.some((s) => s.id === selectedSectionId);

  const handleAddStep = () => {
    if (!onAddSection || disabled) return;
    const nextIdx = stepSections.length + 1;
    onAddSection(
      "step",
      [],
      `Step ${nextIdx}`,
      groupId,
      `Step ${nextIdx}`,
      undefined,
      activeSection?.columns || 1,
    );
  };

  return (
    <section
      aria-label="Stepper group container"
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-all relative shadow-2xs mb-3.5",
        isAnyStepSelected && "border-amber-500/80 ring-1 ring-amber-500/30",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* Stepper Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20 select-none">
        <div className="flex items-center gap-2 overflow-x-auto min-w-0">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-3.5" />
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            {stepSections.map((step, idx) => {
              const isCurrent = step.id === activeStepId;
              const isSelected = step.id === selectedSectionId;
              const config = step.containerConfig || {};

              return (
                <div key={step.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStepIdState(step.id);
                      onSelectSection(step.id);
                      onSelectField(null, null);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer whitespace-nowrap",
                      isCurrent
                        ? "bg-amber-500/15 text-amber-500 font-semibold border border-amber-500/40"
                        : "text-muted-foreground hover:bg-muted/40",
                      isSelected && "ring-1 ring-amber-500",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center size-4 rounded-full text-[10px] font-mono",
                        isCurrent
                          ? "bg-amber-500 text-white font-bold"
                          : "border border-border text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span>{step.groupTitle || step.title || `Step ${idx + 1}`}</span>
                    {config.badge && (
                      <span className="inline-flex items-center px-1 text-[9px] font-mono rounded bg-muted/60">
                        {config.badge}
                      </span>
                    )}
                  </button>

                  {idx < stepSections.length - 1 && (
                    <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              );
            })}

            {onAddSection && !disabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddStep}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Add Step"
              >
                <Plus className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Stepper Toolbar */}
        <div className="flex items-center gap-1 shrink-0">
          {activeSection && onConvertSectionZone && (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => onConvertSectionZone(activeSection.id, "card")}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Convert active step to standalone card"
            >
              <Layers className="size-3" />
            </Button>
          )}

          {activeSection && (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => onRemoveSection(activeSection.id)}
              className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              title="Remove active step"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Stepper Step Body */}
      {activeSection && (
        <section
          aria-label={`Step content for ${activeSection.groupTitle || activeSection.title}`}
          className="p-2.5 bg-card/40 transition-all"
        >
          <TabDropBody
            section={activeSection}
            selectedFieldId={selectedFieldId}
            onSelectSection={onSelectSection}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            onDropPaletteItem={onDropPaletteItem}
            disabled={disabled}
          />
        </section>
      )}
    </section>
  );
}
