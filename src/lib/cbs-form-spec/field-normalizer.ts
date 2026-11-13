import { formatNameToLabel } from "@/lib/core-utils";
import {
  type FormFieldParameter,
  getDefaultWidgetForType,
  isWidgetCompatibleWithType,
  type PropertyType,
} from "@/lib/data-schemas";
import type {
  FormElement,
  FormWidgetType,
  PropertyWidth,
  SemanticWidthToken,
} from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Semantic Width Calculation Formula                               */
/* -------------------------------------------------------------------------- */

/**
 * Authoritative single formula: Derives semantic width token from
 * explicit width, physical DB column capacity (LENGTH), or physical TYPE.
 *
 * Formula:
 * 1. Explicit semantic token in ("xs".."full") -> preserved.
 * 2. Physical LENGTH:
 *    - <= 6  -> "xs"
 *    - <= 16 -> "sm"
 *    - <= 40 -> "md"
 *    - <= 80 -> "lg"
 *    - <= 150 -> "xl"
 *    - > 150 -> "xxl"
 * 3. Physical TYPE fallback:
 *    - Textarea -> "full"
 *    - Boolean  -> "xs"
 *    - Date/DateTime -> "sm"
 *    - Amount/Rate/Number -> "md"
 * 4. Fallback -> "md"
 */
export function deriveSemanticWidth(
  width?: PropertyWidth,
  length?: number,
  type?: string,
): SemanticWidthToken {
  if (
    typeof width === "string" &&
    ["xs", "sm", "md", "lg", "xl", "xxl", "full"].includes(width.toLowerCase().trim())
  ) {
    return width.toLowerCase().trim() as SemanticWidthToken;
  }

  if (typeof length === "number" && length > 0) {
    if (length <= 6) return "xs";
    if (length <= 16) return "sm";
    if (length <= 40) return "md";
    if (length <= 80) return "lg";
    if (length <= 150) return "xl";
    return "xxl";
  }

  const normType = (type || "").toLowerCase().trim();
  if (normType === "textarea" || normType === "json" || normType === "object") return "full";
  if (
    normType === "boolean" ||
    normType === "switch" ||
    normType === "checkbox" ||
    normType === "time"
  )
    return "xs";
  if (normType === "date" || normType === "datetime") return "sm";
  if (normType === "amount" || normType === "rate" || normType === "number") return "md";

  return "md";
}

/**
 * Computes optimal semantic width token from model property attributes (TYPE and physical LENGTH).
 * Canonical helper delegating directly to deriveSemanticWidth.
 */
export function defaultWidthForLength(prop: ModelProperty): PropertyWidth {
  return deriveSemanticWidth(undefined, prop.LENGTH, prop.TYPE);
}

/* -------------------------------------------------------------------------- */
/* Canonical Widget Resolution Formula                                        */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the effective presentation UI widget type given:
 * - physical column TYPE
 * - dynamic parameter lookup / fixed options (PARAMETER)
 * - visual widget override (explicitWidget)
 *
 * Invariant:
 * An explicit widget override is honored ONLY IF it conforms to COMPATIBLE_WIDGETS_FOR_TYPE.
 * If the field has lookups (Model lookup 'M' or options list 'O') and no specialized
 * override is given, it resolves to "select".
 */
export function resolveWidgetType(
  type?: string,
  param?: FormFieldParameter,
  explicitWidget?: string,
): FormWidgetType {
  const normType = (type || "String").trim();
  const paramType = String(param?.TYPE || param?.type || "").toUpperCase();
  const paramData = param?.DATA || param?.data;
  const hasLookup = Boolean(
    paramType === "M" ||
      paramType === "L" ||
      (paramType === "O" && Array.isArray(paramData) && paramData.length > 0),
  );

  if (explicitWidget) {
    const w = explicitWidget.toLowerCase().trim();
    if (w && isWidgetCompatibleWithType(normType as PropertyType, w)) {
      if (hasLookup && w === "text") {
        return "select";
      }
      return w as FormWidgetType;
    }
  }

  if (hasLookup) {
    return "select";
  }

  const typeLower = normType.toLowerCase();
  if (typeLower === "textarea") return "textarea";
  if (typeLower === "datetime") return "datetime";
  if (typeLower === "date") return "date";
  if (typeLower === "time") return "time";
  if (typeLower === "select") return "select";
  if (typeLower === "switch") return "switch";
  if (typeLower === "boolean" || typeLower === "checkbox") return "checkbox";
  if (typeLower === "radio" || typeLower === "radiogroup" || typeLower === "radio-group")
    return "radio-group";
  if (typeLower === "checkbox-group" || typeLower === "checkboxgroup") return "checkbox-group";
  if (typeLower === "rate") return "rate";
  if (typeLower === "amount" || typeLower === "currency") return "amount";
  if (typeLower === "number") return "number";

  return getDefaultWidgetForType(normType as PropertyType);
}

/* -------------------------------------------------------------------------- */
/* Model Property to Form Element Normalizer                                  */
/* -------------------------------------------------------------------------- */

export function normalizeParameter(raw?: Record<string, unknown> | null): FormElement["PARAMETER"] {
  if (!raw) {
    return undefined;
  }
  const rawData: unknown[] = Array.isArray(raw.data)
    ? (raw.data as unknown[])
    : Array.isArray(raw.DATA)
      ? (raw.DATA as unknown[])
      : [];
  const normalizedData = rawData.map((item: unknown) => {
    const d = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const code = String(d.code ?? d.itemCode ?? item ?? "").trim();
    const label = String(d.label ?? d.itemLabel ?? d.code ?? code).trim();
    return {
      code,
      label: label || code,
    };
  });

  const rawType = String(raw.type ?? raw.TYPE ?? "O").toUpperCase();
  const normalizedType = (rawType === "M" || rawType === "L" ? rawType : "O") as "O" | "M" | "L";
  const modelName = String(raw.modelName ?? raw.SOURCE ?? raw.source ?? "");
  const codeField = String(raw.codeField ?? raw.VALUEFIELD ?? raw.valueField ?? "");
  const displayField = String(raw.displayField ?? raw.DISPLAYFIELD ?? "");
  const condition = String(raw.condition ?? raw.CONDITION ?? "");
  const reference = String(raw.reference ?? raw.REFERENCE ?? "");

  return {
    type: normalizedType,
    data: normalizedData,
    modelName,
    codeField,
    displayField,
    condition,
    reference,
  };
}

export function modelPropToFormElement(p: ModelProperty, idx: number = 0): FormElement {
  const snStr = String(p.SN || idx + 1);
  const baseLabel = formatNameToLabel(p.NAME) || `Field #${snStr}`;
  const rawParam = (p as unknown as Record<string, unknown>).PARAMETER as
    | Record<string, unknown>
    | undefined;
  const param = normalizeParameter(rawParam);
  const explicitWidget = (p as Record<string, unknown>).WIDGET as string | undefined;
  const effectiveWidget = resolveWidgetType(p.TYPE, param, explicitWidget);

  const subProps = Array.isArray(p.PROP)
    ? p.PROP.map((sub, sIdx) => modelPropToFormElement(sub, sIdx))
    : undefined;

  return {
    SN: snStr,
    NAME: p.NAME || `field_${snStr}`,
    LABEL: baseLabel,
    TYPE: p.TYPE || "String",
    LENGTH: p.LENGTH ?? 35,
    STRUCTURE: p.STRUCTURE || "S",
    REQUIRED: Boolean(p.REQUIRED),
    DISABLED: false,
    WIDTH: defaultWidthForLength(p),
    WIDGET: effectiveWidget,
    PARAMETER: param,
    PROP: subProps,
    children: subProps,
    VISIBLE_WHEN: (p as Record<string, unknown>).VISIBLE_WHEN as FormElement["VISIBLE_WHEN"],
    DISABLED_WHEN: (p as Record<string, unknown>).DISABLED_WHEN as FormElement["DISABLED_WHEN"],
  };
}
