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
  if (normType === "textarea") return "full";
  if (normType === "boolean" || normType === "switch" || normType === "checkbox") return "xs";
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
  const normType = (type || "Text").trim();
  const hasLookup = Boolean(
    param?.type === "M" || (param?.type === "O" && param.data && param.data.length > 0),
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
  const rawData = Array.isArray(raw.data) ? raw.data : [];
  const normalizedData = rawData.map((item) => {
    const d = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const itemCode = String(d.itemCode ?? d.code ?? item ?? "").trim();
    const itemLabel = String(d.itemLabel ?? d.label ?? d.itemCode ?? itemCode).trim();
    return {
      itemCode,
      itemLabel: itemLabel || itemCode,
    };
  });
  return {
    type: String(raw.type || "O"),
    data: normalizedData,
    modelName: String(raw.modelName || ""),
    codeField: String(raw.codeField || ""),
    displayField: String(raw.displayField || ""),
    condition: String(raw.condition || ""),
    reference: String(raw.reference || ""),
  };
}

export function modelPropToFormElement(p: ModelProperty, idx: number): FormElement {
  const snStr = String(p.SN || idx + 1);
  const baseLabel = p.LABEL || p.NAME || `Field #${snStr}`;
  const param = normalizeParameter(p.PARAMETER);
  const explicitWidget = (p as Record<string, unknown>).WIDGET as string | undefined;
  const effectiveWidget = resolveWidgetType(p.TYPE, param, explicitWidget);

  const subProps = Array.isArray(p.PROP)
    ? p.PROP.map((sub, sIdx) => modelPropToFormElement(sub, sIdx))
    : undefined;

  return {
    SN: snStr,
    NAME: p.NAME || `field_${snStr}`,
    LABEL: baseLabel,
    TYPE: p.TYPE || "Text",
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
