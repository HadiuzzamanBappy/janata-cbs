import type * as React from "react";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { AddSectionFn } from "../canvas/canvas-types";

export interface DesignerContextValue {
  formTitle?: string;
  formDescription?: string;
  authNumber?: number;
  rootColumns?: number;
  rootDensity?: string;
  onUpdateFormConfig?: (patch: {
    title?: string;
    description?: string;
    authNumber?: number;
    columns?: number;
    density?: string;
  }) => void;
  targetModel?: string;
  modelProperties?: ModelProperty[];
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  activeSection: FormSection | null;
  activeField: FormElement | null;
  usedFieldNames: Set<string>;
  disabled?: boolean;
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
  handleCanvasBackgroundClick: () => void;
  // Mutation Handlers
  onAddSection: AddSectionFn;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onAddFieldToSection: (sectionId: string, template?: Partial<FormElement>) => void;
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
  onConvertSectionZone?: (
    sectionId: string,
    targetType: "card" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  handlePaletteAddField: (template: Partial<FormElement>) => void;
  handleDropPaletteItem: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
}

export interface DesignerProviderProps {
  children: React.ReactNode;
  formTitle?: string;
  formDescription?: string;
  authNumber?: number;
  rootColumns?: number;
  rootDensity?: string;
  onUpdateFormConfig?: (patch: {
    title?: string;
    description?: string;
    authNumber?: number;
    columns?: number;
    density?: string;
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
  onAddFieldToSection: (sectionId: string, template?: Partial<FormElement>) => void;
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
  onConvertSectionZone?: (
    sectionId: string,
    targetType: "card" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  disabled?: boolean;
}
