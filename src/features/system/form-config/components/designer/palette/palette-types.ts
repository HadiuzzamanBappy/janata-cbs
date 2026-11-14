import type {
  ContainerConfig,
  FormContainerType,
  FormElement,
  ModelProperty,
} from "@/lib/data-schemas";

export type PaletteTypeFilter = "all" | "unplaced" | "text" | "number" | "date";

export interface FieldPaletteProps {
  className?: string;
  onClose?: () => void;
  // Optional prop overrides for testing / standalone usage
  targetModel?: string;
  modelProperties?: ModelProperty[];
  usedFieldNames?: Set<string>;
  onHighlightField?: (fieldName: string) => void;
  onAddField?: (template: Partial<FormElement>) => void;
  onAddSection?: (
    containerType?: FormContainerType,
    initialFields?: FormElement[],
    customTitle?: string,
    groupId?: string,
    groupTitle?: string,
    insertIndex?: number,
    columns?: number,
    containerConfig?: ContainerConfig,
  ) => void;
  disabled?: boolean;
}

export type PaletteItem =
  | { kind: "single"; property: ModelProperty }
  | { kind: "object-group"; parent: ModelProperty; children: ModelProperty[] };
