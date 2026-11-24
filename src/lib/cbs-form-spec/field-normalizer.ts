import { formatNameToLabel } from "@/lib/core-utils";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  DEFAULT_PROPERTY_LENGTH,
  type FormElement,
  type FormFieldParameter,
  type FormWidgetType,
  getDefaultWidgetForType,
  isWidgetCompatibleWithType,
  type ModelProperty,
  type PropertyStructure,
  type PropertyType,
  type PropertyWidth,
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
  width?: PropertyWidth,
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
  const hasLookup =
    Boolean(
      param &&
        (param.type === "M" ||
          param.type === "A" ||
          (param.type === "O" && Array.isArray(param.data) && param.data.length > 0)),
    ) || Boolean(modelName?.trim());

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
/* Parameter & FormElement Normalizers                                        */
/* -------------------------------------------------------------------------- */

/** Normalizes lookup or fixed-option parameters into a FormFieldParameter. */
export function normalizeParameter(raw?: Record<string, unknown> | null): FormElement["PARAMETER"] {
  if (!raw) return undefined;

  const rawData = Array.isArray(raw.data) ? (raw.data as unknown[]) : [];
  const normalizedData = rawData.map((item) => {
    const d = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const code = String(d.code ?? item ?? "").trim();
    return { code, label: String(d.label ?? code).trim() || code };
  });

  const rawType = String(raw.type ?? "O").toUpperCase();
  const normalizedType = (rawType === "M" || rawType === "A" ? rawType : "O") as "O" | "M" | "A";

  return {
    type: normalizedType,
    data: normalizedData,
    ...(raw.modelName ? { modelName: String(raw.modelName) } : {}),
    ...(raw.recordId ? { recordId: String(raw.recordId) } : {}),
    ...(raw.arrayField ? { arrayField: String(raw.arrayField) } : {}),
    ...(raw.codeField ? { codeField: String(raw.codeField) } : {}),
    ...(raw.displayField ? { displayField: String(raw.displayField) } : {}),
    ...(raw.condition ? { condition: String(raw.condition) } : {}),
  };
}

/** Transforms a physical ModelProperty into an initialized FormElement. */
export function modelPropToFormElement(p: ModelProperty, idx: number = 0): FormElement {
  const snStr = String(p.SN || idx + 1);
  const baseLabel = formatNameToLabel(p.NAME) || `Field #${snStr}`;
  const rawP = p as unknown as Record<string, unknown>;
  const rawParam = rawP.PARAMETER as Record<string, unknown> | undefined;
  let param = normalizeParameter(rawParam);
  const modelName = (p.MODELNAME || "").trim();

  if (!param && modelName) {
    param = {
      type: "M",
      modelName,
      data: [],
    };
  }

  const normType = (p.TYPE || CBS_PROPERTY_TYPE.STRING) as PropertyType;
  const normLength = resolvePhysicalLength(normType, p.LENGTH, DEFAULT_PROPERTY_LENGTH);
  const normStructure = resolvePhysicalStructure(normType, p.STRUCTURE);

  const explicitWidget = rawP.WIDGET as string | undefined;
  const effectiveWidget = resolveWidgetType(p.TYPE, param, explicitWidget, normStructure, {
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
    DISABLED: false,
    WIDTH: deriveSemanticWidth(undefined, p.LENGTH, p.TYPE),
    WIDGET: effectiveWidget,
    PARAMETER: param,
    ...(modelName ? { MODELNAME: modelName } : {}),
    ...(subProps && subProps.length > 0 ? { PROP: subProps } : {}),
    VISIBLE_WHEN: rawP.VISIBLE_WHEN as FormElement["VISIBLE_WHEN"],
    DISABLED_WHEN: rawP.DISABLED_WHEN as FormElement["DISABLED_WHEN"],
  };
}
