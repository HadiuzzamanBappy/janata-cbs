/**
 * @fileoverview Palette drop event dispatcher for Form Designer Canvas.
 * Places palette items (model fields, container presets) dropped onto the canvas or a section.
 *
 * @module features/system/form-config/components/designer/canvas/canvas-drop-dispatcher
 */

import {
  CBS_PARAMETER_TYPE,
  CBS_PROPERTY_STRUCTURE,
  type FormElement,
  type FormSection,
} from "@/lib/data-schemas";
import type { AddSectionFn } from "./canvas-types";
import type { PaletteDragPayload, PaletteDropTarget } from "./drag-payload";

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
    PARAMETER: template.PARAMETER || {
      type: CBS_PARAMETER_TYPE.OPTIONS,
      data: [],
    },
    ENRICHTEXT: template.ENRICHTEXT || "",
    DEFAULTVALUE: template.DEFAULTVALUE || "",
  };
}

export interface DispatchPaletteDropOptions {
  payload: PaletteDragPayload;
  target: PaletteDropTarget;
  sections: FormSection[];
  onAddFieldToSection: (
    sectionId: string,
    template?: Partial<FormElement>,
    insertIndex?: number,
  ) => void;
  onAddSection: AddSectionFn;
}

/**
 * Places a dropped palette item. A field goes into the target section, or becomes its own block on
 * the canvas. A container preset becomes a block on the canvas, a new tab in a group, or (dropped
 * on a section) a new tab beside that tab, or a new container right after that card.
 */
export function dispatchPaletteDrop({
  payload,
  target,
  sections,
  onAddFieldToSection,
  onAddSection,
}: DispatchPaletteDropOptions) {
  if (payload.type === "palette-variable") {
    if (target.kind === "section") {
      onAddFieldToSection(target.sectionId, payload.element, target.insertIndex);
    } else if (target.kind === "canvas") {
      onAddSection("card", {
        fields: [payload.element],
        title: "",
        insertIndex: target.insertIndex,
      });
    }
    return;
  }

  const { containerType, title, groupTitle, columns, containerConfig } = payload;
  if (target.kind === "new-tab") {
    onAddSection("tab", {
      title: target.title,
      groupId: target.groupId,
      groupTitle: target.title,
      columns,
      containerConfig,
    });
    return;
  }
  if (target.kind === "canvas") {
    onAddSection(containerType, {
      title,
      groupTitle,
      insertIndex: target.insertIndex,
      columns,
      containerConfig,
    });
    return;
  }

  const sectionIndex = sections.findIndex((sec) => sec.id === target.sectionId);
  const section = sections[sectionIndex];
  if (!section) return;
  if (section.containerType === "tab" && section.groupId) {
    onAddSection("tab", {
      title,
      groupId: section.groupId,
      groupTitle: title || groupTitle || "New Tab",
      columns,
      containerConfig,
    });
    return;
  }
  onAddSection(containerType, {
    title,
    groupTitle,
    insertIndex: sectionIndex + 1,
    columns,
    containerConfig,
  });
}
