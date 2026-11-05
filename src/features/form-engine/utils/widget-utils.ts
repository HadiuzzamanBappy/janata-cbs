import type { CSSProperties } from "react";
import {
  type FormFieldParameter,
  getDefaultWidgetForType,
  isWidgetCompatibleWithType,
  type PropertyType,
  type PropertyWidth,
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

/**
 * Standard semantic token width mapping aligned with banking density guidelines.
 * 'full' stretches across the entire available row.
 */
export function getFieldWidthStyle(
  length?: number,
  widget?: string,
  width?: PropertyWidth | number,
): CSSProperties | undefined {
  if (
    widget === "switch" ||
    widget === "checkbox" ||
    widget === "radio" ||
    widget === "radio-group" ||
    widget === "checkbox-group"
  ) {
    return undefined;
  }
  if (widget === "textarea") {
    return { width: "100%", flex: 1 };
  }
  if (widget === "date") {
    return { width: "160px", maxWidth: "100%" };
  }
  if (widget === "datetime") {
    return { width: "220px", maxWidth: "100%" };
  }

  // Handle direct numeric pixel widths (from DB / metamodel)
  if (typeof width === "number" && width > 0) {
    if (width >= 1000) {
      return { width: "100%", flex: 1 };
    }
    return { width: `${width}px`, maxWidth: "100%" };
  }

  // Fallback to length ch or standard 280px width
  if (typeof length === "number" && length > 0) {
    const ch = Math.max(length + 4, 10);
    return { width: `${ch}ch`, maxWidth: "100%" };
  }
  return { width: "280px", maxWidth: "100%" };
}
