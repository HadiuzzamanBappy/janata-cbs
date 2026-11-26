import type { FormElement, ModelProperty } from "@/lib/data-schemas";
import type { AddSectionFn } from "../canvas/canvas-types";

export type PaletteTypeFilter = "all" | "placed" | "unplaced";

export interface FieldPaletteProps {
  className?: string;
  onClose?: () => void;
  // Optional prop overrides for testing / standalone usage
  targetModel?: string;
  modelProperties?: ModelProperty[];
  usedFieldNames?: Set<string>;
  onHighlightField?: (fieldName: string) => void;
  onAddField?: (template: Partial<FormElement>) => void;
  onAddSection?: AddSectionFn;
  disabled?: boolean;
}

export type PaletteItem =
  | { kind: "single"; property: ModelProperty }
  | { kind: "object-group"; parent: ModelProperty; children: ModelProperty[] };
