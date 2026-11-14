import type { FormContainerType, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { AddSectionFn } from "./canvas-types";

export interface CreateNewFieldOptions {
  sections: FormSection[];
  template: Partial<FormElement>;
}

/**
 * Creates a normalized FormElement from a partial template.
 */
export function createNewFieldFromTemplate(
  sections: FormSection[],
  template: Partial<FormElement>,
): FormElement {
  const fieldName = template.NAME || `field_${(sections.length + 1).toString()}`;
  return {
    SN: template.SN || String(sections.length + 1),
    NAME: fieldName,
    LABEL: template.LABEL || "New Field",
    TYPE: template.TYPE || "String",
    LENGTH: template.LENGTH ?? 35,
    STRUCTURE: template.STRUCTURE || "S",
    REQUIRED: Boolean(template.REQUIRED),
    DISABLED: template.DISABLED ?? false,
    WIDTH: template.WIDTH ?? "md",
    POSITION: template.POSITION || "",
    PARAMETER: template.PARAMETER || {
      type: "O",
      data: [],
      modelName: "",
      displayField: "",
      condition: "",
      reference: "",
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
  onAddFieldToSection: (sectionId: string, template?: Partial<FormElement>) => void;
  onAddSection: AddSectionFn;
}

/**
 * Dispatches dragged palette payload (variables or containers) to target sections or canvas.
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
  };

  const droppedField = data.element || data.field;
  if ((data.type === "palette-variable" || data.type === "palette-field") && droppedField) {
    if (targetSectionId && targetSectionId !== "canvas-root") {
      onAddFieldToSection(targetSectionId, droppedField);
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
      targetSectionId !== "new-tab-in-group" &&
      data.initialFields &&
      data.initialFields.length > 0
    ) {
      for (const field of data.initialFields) {
        onAddFieldToSection(targetSec.id, field);
      }
      return;
    }

    const isTargetTabGroup =
      targetSectionId === "new-tab-in-group" || (targetSec && targetSec.containerType === "tab");
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
    );
  }
}
