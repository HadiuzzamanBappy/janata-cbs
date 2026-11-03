import type { CSSProperties } from "react";
import type { FormFieldParameter } from "@/lib/data-schemas/form-config-schema";
import type { PropertyWidth } from "@/lib/data-schemas/model-config-schema";

export function resolveWidgetType(
  type?: string,
  param?: FormFieldParameter,
  explicitWidget?: string,
): string {
  if (explicitWidget) {
    const w = explicitWidget.toLowerCase().trim();
    if (w) return w;
  }
  const typeLower = (type || "text").toLowerCase();
  if (typeLower === "textarea") return "textarea";
  if (typeLower === "date") return "date";
  if (typeLower === "select") return "select";
  if (typeLower === "switch") return "switch";
  if (typeLower === "boolean" || typeLower === "checkbox") return "checkbox";
  if (typeLower === "radio") return "radio";
  if (typeLower === "radiogroup" || typeLower === "radio-group") return "radio-group";
  if (typeLower === "checkbox-group" || typeLower === "checkboxgroup") return "checkbox-group";
  if (typeLower === "number") return "number";
  if (typeLower === "amount" || typeLower === "currency") return "amount";
  if (param?.type === "M" || (param?.type === "O" && param.data && param.data.length > 0)) {
    return "select";
  }
  return "text";
}

/**
 * Standard semantic token width mapping aligned with banking density guidelines.
 * 'full' stretches across the entire available row.
 */
export function getFieldWidthStyle(
  length?: number,
  widget?: string,
  width?: PropertyWidth | string | number,
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

  // Handle direct numeric pixel widths (from DB / metamodel)
  const num =
    typeof width === "number"
      ? width
      : typeof width === "string" && /^\d+(\.\d+)?$/.test(width.trim())
        ? Number(width.trim())
        : undefined;

  if (num !== undefined && num > 0) {
    if (num >= 1000) {
      return { width: "100%", flex: 1 };
    }
    return { width: `${num}px`, maxWidth: "100%" };
  }

  // Fallback to length ch or standard 280px width
  if (typeof length === "number" && length > 0) {
    const ch = Math.max(length + 4, 10);
    return { width: `${ch}ch`, maxWidth: "100%" };
  }
  return { width: "280px", maxWidth: "100%" };
}
