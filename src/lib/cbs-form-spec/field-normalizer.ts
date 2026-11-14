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
  type FormFieldParameter,
  getDefaultWidgetForType,
  isWidgetCompatibleWithType,
  type PropertyType,
} from "@/lib/data-schemas";
import {
  type FormElement,
  type FormWidgetType,
  type PropertyWidth,
  SEMANTIC_WIDTH_TOKENS,
  type SemanticWidthToken,
} from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

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

  const normType = (type || "").trim() as PropertyType;
  if (normType === "Json") return "full";
  if (normType === "Boolean" || normType === "Time") return "xs";
  if (normType === "Date" || normType === "DateTime") return "sm";
  if (normType === "Number") return "md";

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
): FormWidgetType {
  const normType = (type || "String").trim() as PropertyType;
  const hasLookup = Boolean(
    param &&
      (param.type === "M" ||
        param.type === "L" ||
        (param.type === "O" && Array.isArray(param.data) && param.data.length > 0)),
  );

  if (explicitWidget) {
    const w = explicitWidget.toLowerCase().trim() as FormWidgetType;
    if (w && isWidgetCompatibleWithType(normType, w)) {
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
  const normalizedType = (rawType === "M" || rawType === "L" ? rawType : "O") as "O" | "M" | "L";

  return {
    type: normalizedType,
    data: normalizedData,
    ...(raw.modelName ? { modelName: String(raw.modelName) } : {}),
    ...(raw.codeField ? { codeField: String(raw.codeField) } : {}),
    ...(raw.displayField ? { displayField: String(raw.displayField) } : {}),
    ...(raw.condition ? { condition: String(raw.condition) } : {}),
    ...(raw.reference ? { reference: String(raw.reference) } : {}),
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
  const param = normalizeParameter(rawParam);
  const explicitWidget = rawP.WIDGET as string | undefined;
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
    ...(subProps && subProps.length > 0 ? { PROP: subProps } : {}),
    VISIBLE_WHEN: rawP.VISIBLE_WHEN as FormElement["VISIBLE_WHEN"],
    DISABLED_WHEN: rawP.DISABLED_WHEN as FormElement["DISABLED_WHEN"],
  };
}
