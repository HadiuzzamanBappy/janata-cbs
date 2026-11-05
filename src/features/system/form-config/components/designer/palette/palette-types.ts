import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface FieldPaletteProps {
  targetModel?: string;
  modelProperties?: ModelProperty[];
  usedFieldNames?: Set<string>;
  onHighlightField?: (fieldName: string) => void;
  onAddField: (template: Partial<FormElement>) => void;
  onAddSection: (
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
  disabled?: boolean;
}

export type PaletteItem =
  | { kind: "single"; property: ModelProperty }
  | { kind: "object-group"; parent: ModelProperty; children: ModelProperty[] };

export function modelPropToFormElement(prop: ModelProperty): FormElement {
  return {
    SN: prop.SN || "1",
    NAME: prop.NAME,
    LABEL: prop.LABEL || prop.NAME,
    TYPE: prop.TYPE || "Text",
    LENGTH: prop.LENGTH ?? 35,
    STRUCTURE: prop.STRUCTURE || "S",
    REQUIRED: Boolean(prop.REQUIRED),
    DISABLED: false,
    WIDTH: 280,
    POSITION: "",
    PARAMETER: {
      type: "O",
      data: [],
      modelName: "",
      displayField: "",
      condition: "",
      reference: "",
    },
    ENRICHTEXT: "",
    DEFAULTVALUE: "",
  };
}
