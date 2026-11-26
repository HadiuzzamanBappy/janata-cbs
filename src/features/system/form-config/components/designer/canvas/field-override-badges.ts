import {
  CBS_PROPERTY_STRUCTURE,
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
  const physicalType = (matchedProp?.TYPE || field.TYPE || "String") as PropertyType;
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
      className: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 font-semibold",
    });
  }

  if (field.DISABLED_WHEN) {
    list.push({
      key: "rule-dis",
      label: "DIS",
      variant: "secondary",
      className:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold",
    });
  }

  if (Array.isArray(field.CASCADE) && field.CASCADE.length > 0) {
    list.push({
      key: "rule-cas",
      label: "CAS",
      variant: "secondary",
      className:
        "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold",
    });
  }

  if (field.ON_CHANGE?.target) {
    list.push({
      key: "rule-chg",
      label: "CHG",
      variant: "secondary",
      className:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold",
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
      className:
        "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold",
    });
  }

  return list;
}
