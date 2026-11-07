import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { AddSectionFn } from "../canvas/canvas-types";

export type DragPayload = Record<string, unknown>;

export interface SortableTabGroupCardProps {
  groupId: string;
  tabSections: FormSection[];
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
  onReorderSections?: (activeId: string, overId: string, insertIndex?: number) => void;
  onMoveFieldAcrossSections?: (
    sourceSecId: string,
    targetSecId: string,
    fieldId: string,
    targetFieldId?: string,
    insertAtIndex?: number,
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  isCanvasDragging?: boolean;
  disabled?: boolean;
}

export function isTabGroupPayload(p: DragPayload): boolean {
  return (
    p.type === "palette-tabgroup" ||
    p.containerType === "tab" ||
    (p.type === "palette-container" && p.containerType === "tab")
  );
}

export function isContainerPayload(p: DragPayload): boolean {
  return (
    p.type === "palette-container" ||
    ["card", "plain", "tab", "step", "accordion"].includes(String(p.containerType || ""))
  );
}
