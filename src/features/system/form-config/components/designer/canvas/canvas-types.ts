import type { FormElement, FormSection } from "@/lib/data-schemas/form-config-schema";

/** Callback signature for adding a new section/container to the canvas */
export type AddSectionFn = (
  type: "standard" | "object-group" | "array-table",
  zone?: "header" | "tab" | "standard",
  initialFields?: FormElement[],
  layoutStyle?: "card" | "plain",
  customTitle?: string,
  tabGroupId?: string,
  tabTitle?: string,
  insertIndex?: number,
  columns?: number,
  bindKey?: string,
  structure?: "S" | "M",
) => void;

export interface DesignerCanvasProps {
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  /**
   * fieldId = null means deselect; sectionId provides which section
   * the field belongs to so the property inspector can resolve it.
   */
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
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
  /**
   * Convert a section's zone: card → tab or tab → card
   */
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  /** Called when user clicks the bare canvas background — not on any card. */
  onClickBackground?: () => void;
  disabled?: boolean;
}
