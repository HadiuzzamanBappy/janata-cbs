import {
  type FormFieldParameter,
  getDefaultWidgetForType,
  isWidgetCompatibleWithType,
  type PropertyType,
} from "@/lib/data-schemas";

export function resolveWidgetType(
  type?: string,
  param?: FormFieldParameter,
  explicitWidget?: string,
): string {
  const normType = (type || "Text").trim();
  const hasLookup = Boolean(
    param?.type === "M" || (param?.type === "O" && param.data && param.data.length > 0),
  );

  // If explicitWidget is supplied, verify it is compatible with physical type
  if (explicitWidget) {
    const w = explicitWidget.toLowerCase().trim();
    if (w && isWidgetCompatibleWithType(normType as PropertyType, w)) {
      // If field has lookup options (fixed list or table), "text" was just the unconfigured fallback
      if (hasLookup && w === "text") {
        return "select";
      }
      return w;
    }
  }

  // Both Fixed Options (O) and Model Lookup (M) resolve to the CBS lookup select widget
  if (hasLookup) {
    return "select";
  }

  const typeLower = normType.toLowerCase();
  if (typeLower === "textarea") return "textarea";
  if (typeLower === "datetime") return "datetime";
  if (typeLower === "date") return "date";
  if (typeLower === "select") return "select";
  if (typeLower === "switch") return "switch";
  if (typeLower === "boolean" || typeLower === "checkbox") return "checkbox";
  if (typeLower === "radio") return "radio";
  if (typeLower === "radiogroup" || typeLower === "radio-group") return "radio-group";
  if (typeLower === "checkbox-group" || typeLower === "checkboxgroup") return "checkbox-group";
  if (typeLower === "rate") return "rate";
  if (typeLower === "amount" || typeLower === "currency") return "amount";
  if (typeLower === "number") return "number";

  return getDefaultWidgetForType(normType as PropertyType);
}
