import type { CSSProperties } from "react";
import type { FormFieldParameter } from "@/lib/data-schemas/form-config-schema";

export function resolveWidgetType(type?: string, param?: FormFieldParameter): string {
  const typeLower = (type || "text").toLowerCase();
  if (typeLower === "textarea") return "textarea";
  if (typeLower === "date") return "date";
  if (typeLower === "select") return "select";
  if (typeLower === "switch" || typeLower === "boolean") return "switch";
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

export function getFieldWidthStyle(
  length?: number,
  widget?: string,
  width?: number,
): CSSProperties | undefined {
  if (
    widget === "switch" ||
    widget === "radio" ||
    widget === "radio-group" ||
    widget === "checkbox-group"
  ) {
    return undefined;
  }
  if (widget === "textarea") {
    return { width: "100%", maxWidth: "600px" };
  }
  if (widget === "date") {
    return { width: "144px", maxWidth: "100%" };
  }
  if (typeof width === "number" && width > 0) {
    return { width: `${width}px`, maxWidth: "100%" };
  }
  if (typeof length === "number" && length > 0) {
    const ch = Math.max(length + 4, 10);
    return { width: `${ch}ch`, maxWidth: "100%" };
  }
  return { width: "240px", maxWidth: "100%" };
}
