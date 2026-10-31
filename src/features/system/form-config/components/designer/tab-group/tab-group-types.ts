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
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
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
    (p.type === "palette-container" && p.zone === "tab") ||
    p.zone === "tab"
  );
}

export function isContainerPayload(p: DragPayload): boolean {
  return (
    p.type === "palette-container" ||
    ["standard", "object-group", "array-table"].includes(String(p.containerType || ""))
  );
}
