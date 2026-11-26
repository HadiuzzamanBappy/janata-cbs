/**
 * @fileoverview Palette drop event dispatcher for Form Designer Canvas.
 * Dispatches variables or structural container presets dropped onto canvas sections.
 *
 * @module features/system/form-config/components/designer/canvas/canvas-drop-dispatcher
 */

import {
  CBS_PROPERTY_STRUCTURE,
  type ContainerConfig,
  type FormContainerType,
  type FormElement,
  type FormSection,
} from "@/lib/data-schemas";
import type { AddSectionFn } from "./canvas-types";

/**
 * Creates a normalized FormElement from a partial template.
 */
export function createNewFieldFromTemplate(
  sections: FormSection[],
  template: Partial<FormElement>,
): FormElement {
  const fieldName = template.NAME || `field_${(sections.length + 1).toString()}`;
  return {
    ...template,
    SN: template.SN || String(sections.length + 1),
    NAME: fieldName,
    LABEL: template.LABEL || "New Field",
    TYPE: template.TYPE || "String",
    LENGTH: template.LENGTH ?? 35,
    STRUCTURE: template.STRUCTURE || CBS_PROPERTY_STRUCTURE.SINGLE,
    REQUIRED: Boolean(template.REQUIRED),
    DISABLED: template.DISABLED ?? false,
    WIDTH: template.WIDTH ?? "md",
    PARAMETER: template.PARAMETER || {
      type: "O",
      data: [],
    },
    ENRICHTEXT: template.ENRICHTEXT || "",
    DEFAULTVALUE: template.DEFAULTVALUE || "",
  };
}

export interface DispatchPaletteDropOptions {
  payload: unknown;
  sections: FormSection[];
  targetSectionId?: string;
  insertIndex?: number;
  onAddFieldToSection: (
    sectionId: string,
    template?: Partial<FormElement>,
    insertIndex?: number,
  ) => void;
  onAddSection: AddSectionFn;
}

/** Drop target id for "add as a new tab" on a tab strip; it names no section. */
export const NEW_TAB_IN_GROUP_TARGET = "new-tab-in-group";

/**
 * Dispatches dragged palette payload (variables or containers) to target sections or canvas.
 * No `targetSectionId` means the canvas root (between blocks).
 */
export function dispatchPaletteDrop({
  payload,
  sections,
  targetSectionId,
  insertIndex,
  onAddFieldToSection,
  onAddSection,
}: DispatchPaletteDropOptions) {
  if (!payload || typeof payload !== "object") return;
  const data = payload as {
    type?: string;
    element?: FormElement;
    field?: FormElement;
    initialFields?: FormElement[];
    containerType?: FormContainerType;
    title?: string;
    groupId?: string;
    groupTitle?: string;
    columns?: number;
    containerConfig?: ContainerConfig;
  };

  const droppedField = data.element || data.field;
  if ((data.type === "palette-variable" || data.type === "palette-field") && droppedField) {
    if (targetSectionId) {
      onAddFieldToSection(targetSectionId, droppedField, insertIndex);
    } else {
      // Direct drop on canvas root: create an independent standalone field block at targetIndex.
      // Never silently inject into an existing selected section.
      const targetIndex = insertIndex !== undefined ? insertIndex : sections.length;
      onAddSection("card", [droppedField], "", undefined, undefined, targetIndex);
    }
    return;
  }

  if (data.type === "palette-container" && data.containerType) {
    const targetSec = targetSectionId ? sections.find((s) => s.id === targetSectionId) : null;
    if (
      targetSec &&
      targetSectionId !== NEW_TAB_IN_GROUP_TARGET &&
      data.initialFields &&
      data.initialFields.length > 0
    ) {
      for (const field of data.initialFields) {
        onAddFieldToSection(targetSec.id, field);
      }
      return;
    }

    const isTargetTabGroup =
      targetSectionId === NEW_TAB_IN_GROUP_TARGET ||
      (targetSec && targetSec.containerType === "tab");
    const targetGroupId = isTargetTabGroup ? data.groupId || targetSec?.groupId : undefined;
    const effectiveGroupTitle = isTargetTabGroup
      ? data.title || data.groupTitle || "New Tab"
      : data.groupTitle;

    onAddSection(
      isTargetTabGroup ? "tab" : data.containerType,
      data.initialFields || [],
      data.title,
      targetGroupId,
      effectiveGroupTitle,
      insertIndex,
      data.columns,
      data.containerConfig,
    );
  }
}
