import type * as React from "react";
import type {
  FormDensity,
  FormElement,
  FormLayout,
  FormSection,
  ModelProperty,
} from "@/lib/data-schemas";
import type { FormConfigValidationError } from "../../../hooks/fc-validation";
import type { AddSectionFn, ConvertSectionZoneFn } from "../canvas/canvas-types";
import type { PaletteDragPayload, PaletteDropTarget } from "../canvas/drag-payload";

export interface DesignerContextValue {
  formTitle?: string;
  formDescription?: string;
  authNumber?: number;
  rootLayout?: FormLayout;
  rootDensity?: FormDensity;
  onUpdateFormConfig?: (patch: {
    title?: string;
    description?: string;
    authNumber?: number;
    layout?: FormLayout;
    density?: FormDensity;
  }) => void;
  targetModel?: string;
  modelProperties?: ModelProperty[];
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  activeSection: FormSection | null;
  activeField: FormElement | null;
  /** The object group holding the active field, when the active field is an inner field. */
  activeParentField: FormElement | null;
  tabScope: "container" | "item";
  setTabScope: (scope: "container" | "item") => void;
  usedFieldNames: Set<string>;
  disabled?: boolean;
  validationErrors?: FormConfigValidationError[];
  getSectionErrors: (sectionId: string) => FormConfigValidationError[];
  getFieldErrors: (fieldId: string) => FormConfigValidationError[];
  // Responsive / Drawer state
  isCompact: boolean;
  isPaletteOpen: boolean;
  isInspectorOpen: boolean;
  hasSelection: boolean;
  setIsPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  togglePalette: () => void;
  toggleInspector: () => void;
  closeDrawers: () => void;
  // Selection Handlers
  onSelectSection: (id: string | null) => void;
  onSelectField: (id: string | null) => void;
  handleHighlightField: (fieldName: string) => void;
  handleCanvasSelectField: (sectionId: string | null, fieldId: string | null) => void;
  handleCanvasSelectSection: (sectionId: string | null) => void;
  handleCanvasBackgroundClick: () => void;
  // Mutation Handlers
  onAddSection: AddSectionFn;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onAddFieldToSection: (
    sectionId: string,
    template?: Partial<FormElement>,
    insertIndex?: number,
  ) => void;
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
  onConvertSectionZone?: ConvertSectionZoneFn;
  onUngroupSection?: (id: string) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  handlePaletteAddField: (template: Partial<FormElement>) => void;
  handleDropPaletteItem: (payload: PaletteDragPayload, target: PaletteDropTarget) => void;
}

export interface DesignerProviderProps {
  children: React.ReactNode;
  formTitle?: string;
  formDescription?: string;
  authNumber?: number;
  rootLayout?: FormLayout;
  rootDensity?: FormDensity;
  onUpdateFormConfig?: (patch: {
    title?: string;
    description?: string;
    authNumber?: number;
    layout?: FormLayout;
    density?: FormDensity;
  }) => void;
  isCompact?: boolean;
  targetModel?: string;
  modelProperties?: ModelProperty[];
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (id: string | null) => void;
  onAddSection: AddSectionFn;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onAddFieldToSection: (
    sectionId: string,
    template?: Partial<FormElement>,
    insertIndex?: number,
  ) => void;
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
  onConvertSectionZone?: ConvertSectionZoneFn;
  onUngroupSection?: (id: string) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  disabled?: boolean;
  validationErrors?: FormConfigValidationError[];
}
