import { modelPropToFormElement } from "@/lib/cbs-form-spec";
import type { FormContainerType } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export { modelPropToFormElement };

export interface FieldPaletteProps {
  targetModel?: string;
  modelProperties?: ModelProperty[];
  usedFieldNames?: Set<string>;
  onHighlightField?: (fieldName: string) => void;
  onAddField: (template: Partial<FormElement>) => void;
  onAddSection: (
    containerType?: FormContainerType,
    initialFields?: FormElement[],
    customTitle?: string,
    groupId?: string,
    groupTitle?: string,
    insertIndex?: number,
    columns?: number,
  ) => void;
  disabled?: boolean;
  className?: string;
  onClose?: () => void;
}

export type PaletteItem =
  | { kind: "single"; property: ModelProperty }
  | { kind: "object-group"; parent: ModelProperty; children: ModelProperty[] };
