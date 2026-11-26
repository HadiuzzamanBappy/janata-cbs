import type {
  ContainerConfig,
  FormContainerType,
  FormElement,
  FormSection,
} from "@/lib/data-schemas";
import type { PaletteDragPayload, PaletteDropTarget } from "./drag-payload";

/** Where a section goes: its tab group (for a tab) and its index among the sections. */
export interface SectionPlacement {
  groupId?: string;
  groupTitle?: string;
  /** Index among the sections; unset appends (a tab joins the end of its group). */
  insertIndex?: number;
}

/** A new section: its first fields, title, grid and container settings, and placement. */
export interface NewSectionOptions extends SectionPlacement {
  fields?: FormElement[];
  title?: string;
  columns?: number;
  containerConfig?: ContainerConfig;
}

export type AddSectionFn = (containerType: FormContainerType, options?: NewSectionOptions) => void;

/** Converts a section between card and tab (a tab joins `placement.groupId`, or a new group). */
export type ConvertSectionZoneFn = (
  sectionId: string,
  targetType: FormContainerType,
  placement?: SectionPlacement,
) => void;

export interface DesignerCanvasProps {
  sections?: FormSection[];
  selectedSectionId?: string | null;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  /**
   * fieldId = null means deselect; sectionId provides which section
   * the field belongs to so the property inspector can resolve it.
   */
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
  onUpdateSection?: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection?: (id: string) => void;
  onRemoveField?: (fieldId: string) => void;
  onReorderFields?: (sectionId: string, activeId: string, overId: string) => void;
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
  onConvertSectionZone?: ConvertSectionZoneFn;
  onUngroupSection?: (id: string) => void;
  onDropPaletteItem?: (payload: PaletteDragPayload, target: PaletteDropTarget) => void;
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
