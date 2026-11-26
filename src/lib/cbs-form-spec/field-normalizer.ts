import { formatNameToLabel } from "@/lib/core-utils";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  DEFAULT_PROPERTY_LENGTH,
  type FormElement,
  type FormFieldParameter,
  type FormWidgetType,
  getDefaultWidgetForType,
  hasFieldOptions,
  isWidgetCompatibleWithType,
  type ModelProperty,
  type PropertyStructure,
  type PropertyType,
  resolveFieldParameter,
  resolvePhysicalLength,
  resolvePhysicalStructure,
  SEMANTIC_WIDTH_TOKENS,
  type SemanticWidthToken,
} from "@/lib/data-schemas";

/* -------------------------------------------------------------------------- */
/* Semantic Width Derivation                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Derives a semantic width token ("xs".."full") from an explicit width override,
 * physical DB column LENGTH (<=6 xs, <=16 sm, <=40 md, <=80 lg, <=150 xl, >150 xxl), or TYPE.
 */
export function deriveSemanticWidth(
  width?: SemanticWidthToken,
  length?: number,
  type?: string,
): SemanticWidthToken {
  const normalizedWidth = typeof width === "string" ? width.toLowerCase().trim() : "";
  if ((SEMANTIC_WIDTH_TOKENS as readonly string[]).includes(normalizedWidth)) {
    return normalizedWidth as SemanticWidthToken;
  }

  if (typeof length === "number" && length > 0) {
    if (length <= 6) return "xs";
    if (length <= 16) return "sm";
    if (length <= 40) return "md";
    if (length <= 80) return "lg";
    if (length <= 150) return "xl";
    return "xxl";
  }

  const normType = (type || "").trim();
  if (normType === CBS_PROPERTY_TYPE.ARRAY) return "full";
  if (normType === CBS_PROPERTY_TYPE.BOOLEAN || normType === CBS_PROPERTY_TYPE.TIME) return "xs";
  if (normType === CBS_PROPERTY_TYPE.DATE || normType === CBS_PROPERTY_TYPE.DATETIME) return "sm";

  return "md";
}

/* -------------------------------------------------------------------------- */
/* Widget Resolution                                                          */
/* -------------------------------------------------------------------------- */

/** Resolves the presentation UI widget from physical type, lookups, and compatible overrides. */
export function resolveWidgetType(
  type?: string,
  param?: FormFieldParameter,
  explicitWidget?: string,
  structure: PropertyStructure = CBS_PROPERTY_STRUCTURE.SINGLE,
  options?: { length?: number; modelName?: string },
): FormWidgetType {
  const normType = (type || CBS_PROPERTY_TYPE.STRING).trim() as PropertyType;
  const modelName = options?.modelName || param?.modelName;
  const hasLookup = hasFieldOptions(param, modelName);

  if (explicitWidget) {
    const w = explicitWidget.toLowerCase().trim() as FormWidgetType;
    if (
      w &&
      isWidgetCompatibleWithType(normType, w, structure, {
        length: options?.length,
        modelName,
      })
    ) {
      if (hasLookup && w === "text") {
        return "select";
      }
      return w;
    }
  }

  if (hasLookup) {
    return "select";
  }

  return getDefaultWidgetForType(normType);
}

/* -------------------------------------------------------------------------- */
/* FormElement Normalizer                                                     */
/* -------------------------------------------------------------------------- */

/** Transforms a physical ModelProperty into an initialized FormElement. */
export function modelPropToFormElement(p: ModelProperty, idx: number = 0): FormElement {
  const snStr = String(p.SN || idx + 1);
  const baseLabel = formatNameToLabel(p.NAME) || `Field #${snStr}`;
  const modelName = (p.MODELNAME || "").trim();
  const param = resolveFieldParameter(undefined, modelName);

  const normType = (p.TYPE || CBS_PROPERTY_TYPE.STRING) as PropertyType;
  const normLength = resolvePhysicalLength(normType, p.LENGTH, DEFAULT_PROPERTY_LENGTH);
  const normStructure = resolvePhysicalStructure(normType, p.STRUCTURE);

  const effectiveWidget = resolveWidgetType(p.TYPE, param, undefined, normStructure, {
    length: normLength,
    modelName,
  });

  const subProps = Array.isArray(p.PROP)
    ? p.PROP.map((sub, sIdx) => modelPropToFormElement(sub, sIdx))
    : undefined;

  return {
    SN: snStr,
    NAME: p.NAME || `field_${snStr}`,
    LABEL: baseLabel,
    TYPE: normType,
    LENGTH: normLength,
    STRUCTURE: normStructure,
    REQUIRED: Boolean(p.REQUIRED),
    WIDGET: effectiveWidget,
    PARAMETER: param,
    ...(modelName ? { MODELNAME: modelName } : {}),
    ...(subProps && subProps.length > 0 ? { PROP: subProps } : {}),
  };
}
