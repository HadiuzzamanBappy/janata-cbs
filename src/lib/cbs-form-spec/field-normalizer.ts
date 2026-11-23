/**
 * @fileoverview Canonical Field Normalizer & Semantic Width Derivation
 * @module cbs-form-spec/field-normalizer
 *
 * Core Invariants:
 * - Maps physical database types and character lengths to high-density semantic width tokens.
 * - Resolves presentation widgets according to physical type compatibility and lookup capabilities.
 * - Transforms raw ModelProperty records into fully initialized FormElement structures.
 */

import { formatNameToLabel } from "@/lib/core-utils";
import {
  CBS_PROPERTY_TYPE,
  DEFAULT_SUB_PROPERTY_LENGTH,
  type FormElement,
  type FormFieldParameter,
  type FormWidgetType,
  getDefaultWidgetForType,
  isWidgetCompatibleWithType,
  type ModelProperty,
  type PropertyType,
  type PropertyWidth,
  resolvePhysicalLength,
  resolvePhysicalStructure,
  SEMANTIC_WIDTH_TOKENS,
  type SemanticWidthToken,
} from "@/lib/data-schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Width Derivation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives a responsive semantic width token ("xs".."full") from explicit width,
 * physical DB column capacity (LENGTH), or physical TYPE.
 *
 * Sizing tiers:
 * - <= 6   -> "xs"  (branch code, currency, small flags)
 * - <= 16  -> "sm"  (account numbers, dates, short codes)
 * - <= 40  -> "md"  (standard amounts, IDs, customer names)
 * - <= 80  -> "lg"  (full titles, corporate entities)
 * - <= 150 -> "xl"  (street address, narration)
 * - > 150  -> "xxl" (extended remarks)
 *
 * @param width Explicit width override ("xs".."full") if defined.
 * @param length Physical database column character capacity.
 * @param type Physical property data type ("String" | "Number" | "Date" | etc.).
 * @returns Canonical SemanticWidthToken for layout grid and input element styling.
 */
export function deriveSemanticWidth(
  width?: PropertyWidth,
  length?: number,
  type?: string,
): SemanticWidthToken {
  if (
    typeof width === "string" &&
    (SEMANTIC_WIDTH_TOKENS as readonly string[]).includes(width.toLowerCase().trim())
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

  const normType = (type || "").trim();
  if (normType === CBS_PROPERTY_TYPE.ARRAY) return "full";
  if (normType === CBS_PROPERTY_TYPE.BOOLEAN || normType === CBS_PROPERTY_TYPE.TIME) return "xs";
  if (normType === CBS_PROPERTY_TYPE.DATE || normType === CBS_PROPERTY_TYPE.DATETIME) return "sm";
  if (normType === CBS_PROPERTY_TYPE.NUMBER) return "md";

  return "md";
}

/**
 * Computes optimal semantic width token from model property attributes.
 *
 * @param prop Physical model property definition.
 * @returns Derived PropertyWidth token.
 */
export function defaultWidthForLength(prop: ModelProperty): PropertyWidth {
  return deriveSemanticWidth(undefined, prop.LENGTH, prop.TYPE);
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget Resolution
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Resolves the presentation UI widget type based on physical type, lookups, and explicit overrides.
 * Honors explicit overrides only if they conform to COMPATIBLE_WIDGETS_FOR_TYPE.
 *
 * @param type Physical database column type.
 * @param param Lookup parameter configuration (fixed options "O", model lookup "M", list "L").
 * @param explicitWidget Explicit visual widget override from form designer.
 * @returns Canonical FormWidgetType (e.g. "text", "select", "date", "time", "switch").
 */
export function resolveWidgetType(
  type?: string,
  param?: FormFieldParameter,
  explicitWidget?: string,
  structure: "S" | "M" = "S",
  options?: { length?: number; modelName?: string },
): FormWidgetType {
  const normType = (type || "String").trim() as PropertyType;
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

// ─────────────────────────────────────────────────────────────────────────────
// Parameter & FormElement Normalizers
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Normalizes dynamic lookup or fixed option parameters into a strict FormFieldParameter.
 *
 * @param raw Unsanitized parameter dictionary from metadata or JSON schemas.
 * @returns Sanitized FormFieldParameter structure, or undefined if empty.
 */
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

/**
 * Transforms a physical ModelProperty into an initialized FormElement.
 * Generates sensible defaults for layout, widgets, labels, and sub-properties.
 *
 * @param p Physical model property from ModelConfig.
 * @param idx Sequential zero-based index in the property list.
 * @returns Fully initialized FormElement.
 */
export function modelPropToFormElement(p: ModelProperty, idx: number = 0): FormElement {
  const snStr = String(p.SN || idx + 1);
  const baseLabel = formatNameToLabel(p.NAME) || `Field #${snStr}`;
  const rawP = p as unknown as Record<string, unknown>;
  const rawParam = rawP.PARAMETER as Record<string, unknown> | undefined;
  let param = normalizeParameter(rawParam);
  const modelName = (p.MODELNAME || (rawP.MODELNAME as string) || "").trim();

  if (!param && modelName) {
    param = {
      type: "M",
      modelName,
      data: [],
    };
  }

  const normType = (p.TYPE || "String") as PropertyType;
  const normLength = resolvePhysicalLength(normType, p.LENGTH, DEFAULT_SUB_PROPERTY_LENGTH);
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
    WIDTH: defaultWidthForLength(p),
    WIDGET: effectiveWidget,
    PARAMETER: param,
    ...(modelName ? { MODELNAME: modelName } : {}),
    ...(subProps && subProps.length > 0 ? { PROP: subProps } : {}),
    VISIBLE_WHEN: rawP.VISIBLE_WHEN as FormElement["VISIBLE_WHEN"],
    DISABLED_WHEN: rawP.DISABLED_WHEN as FormElement["DISABLED_WHEN"],
  };
}
