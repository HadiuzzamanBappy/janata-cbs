import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";

/** Callback signature for adding a new section/container to the canvas */
export type AddSectionFn = (
  containerType?: "card" | "plain" | "tab" | "step" | "accordion",
  initialFields?: FormElement[],
  customTitle?: string,
  groupId?: string,
  groupTitle?: string,
  insertIndex?: number,
  columns?: number,
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
    targetType: "card" | "plain" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  /** Called when user clicks the bare canvas background — not on any card. */
  onClickBackground?: () => void;
  disabled?: boolean;
  isCompact?: boolean;
  isPaletteOpen?: boolean;
  isInspectorOpen?: boolean;
  hasSelection?: boolean;
  onTogglePalette?: () => void;
  onToggleInspector?: () => void;
}
