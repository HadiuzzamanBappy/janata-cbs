import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  type FormElement,
  getDefaultWidgetForType,
  type ModelProperty,
  type PropertyType,
} from "@/lib/data-schemas";

export interface FieldOverrideBadge {
  key: string;
  label: string;
  variant?: "secondary" | "outline";
  className?: string;
}

/** The canvas badges for what a field changes from its model column, and the rules it carries. */
export function fieldOverrideBadges(
  field: FormElement,
  matchedProp: ModelProperty | undefined,
): FieldOverrideBadge[] {
  const list: FieldOverrideBadge[] = [];

  // 1. Widget override
  const physicalType = (matchedProp?.TYPE ||
    field.TYPE ||
    CBS_PROPERTY_TYPE.STRING) as PropertyType;
  const defaultWidget = getDefaultWidgetForType(physicalType);
  if (field.WIDGET && field.WIDGET !== defaultWidget) {
    list.push({ key: "widget", label: field.WIDGET.toUpperCase(), variant: "outline" });
  }

  // 3. Disabled / Read-Only override
  if (field.DISABLED) {
    list.push({
      key: "disabled",
      label: "DISABLED",
      variant: "outline",
      className: "text-muted-foreground border-border bg-muted/40",
    });
  }

  // 4. Structure override (e.g. Model is M, but form chose S)
  if (
    matchedProp?.STRUCTURE === CBS_PROPERTY_STRUCTURE.MULTI &&
    field.STRUCTURE === CBS_PROPERTY_STRUCTURE.SINGLE
  ) {
    list.push({ key: "structure", label: "SINGLE", variant: "outline" });
  }

  // 5. Active Rule Badges (Visible When, Disabled When, Cascade, On Change, Validation)
  if (field.VISIBLE_WHEN) {
    list.push({
      key: "rule-vis",
      label: "VIS",
      variant: "secondary",
      className: "bg-info/15 text-info border-info/30 font-semibold",
    });
  }

  if (field.DISABLED_WHEN) {
    list.push({
      key: "rule-dis",
      label: "DIS",
      variant: "secondary",
      className: "bg-warning/15 text-warning border-warning/30 font-semibold",
    });
  }

  if (Array.isArray(field.CASCADE) && field.CASCADE.length > 0) {
    list.push({
      key: "rule-cas",
      label: "CAS",
      variant: "secondary",
      className: "bg-primary/15 text-primary border-primary/30 font-semibold",
    });
  }

  if (field.ON_CHANGE?.target) {
    list.push({
      key: "rule-chg",
      label: "CHG",
      variant: "secondary",
      className: "bg-success/15 text-success border-success/30 font-semibold",
    });
  }

  if (
    (field.TRANSFORM && field.TRANSFORM !== "none") ||
    field.VALIDATION?.matches ||
    field.VALIDATION?.min !== undefined ||
    field.VALIDATION?.max !== undefined
  ) {
    list.push({
      key: "rule-val",
      label: "VAL",
      variant: "secondary",
      className: "bg-secondary text-secondary-foreground border-border font-semibold",
    });
  }

  return list;
}
