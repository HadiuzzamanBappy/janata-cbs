/**
 * @fileoverview Master Form Specification Compiler & Fallback Layout Generator
 * @module cbs-form-spec/compile
 *
 * Core Invariants:
 * - ModelConfigRecord is the sole authority on physical schema (TYPE, LENGTH, STRUCTURE, REQUIRED).
 * - FormConfigRecord provides presentation structure (sections, widgets, labels, widths, rules).
 * - Fallback: When no custom layout exists, produces a canonical 12-column responsive card section.
 */

import { formatNameToLabel } from "@/lib/core-utils";
import {
  DEFAULT_PROPERTY_LENGTH,
  type FormConfigRecord,
  type FormElement,
  type FormSection,
  type ModelConfigRecord,
  type ModelProperty,
  type PropertyType,
  resolveFieldParameter,
  resolvePhysicalLength,
  resolvePhysicalStructure,
} from "@/lib/data-schemas";
import { deriveSemanticWidth, modelPropToFormElement, resolveWidgetType } from "./field-normalizer";

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Layout Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds canonical 12-column responsive fallback sections from a physical ModelConfigRecord.
 * Preserves definition order and compiles nested properties into inline sub-groups.
 *
 * @param model Physical model configuration from backend core.
 * @returns Standard single-section card layout containing all model fields.
 * @internal Exported only for scripts/verify.
 */
export function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const allProps = model.PROPERTIES || [];
  if (allProps.length === 0) return [];

  const fields: FormElement[] = allProps.map((p, idx) => modelPropToFormElement(p, idx));

  return [
    {
      id: "sec_std_1",
      title: "",
      description: "",
      containerType: "card",
      containerConfig: { variant: "ghost", density: "compact" },
      columns: 1,
      collapsible: false,
      isCollapsed: false,
      fields,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Field-Level Model Merger
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds a layout field's model property by NAME, ignoring case and surrounding spaces. This is the
 * one runtime matching rule: the compiler and the designer's save check both use it.
 */
export function modelPropertyMatcher(
  properties: ModelProperty[] | undefined,
): (name: string) => ModelProperty | undefined {
  const byName = new Map((properties ?? []).map((p) => [p.NAME.trim().toLowerCase(), p]));
  return (name) => byName.get(name.trim().toLowerCase());
}

/**
 * Merges a visual presentation FormElement with its underlying physical ModelProperty:
 * - DB Constraints (Authority: ModelConfig): TYPE, LENGTH, STRUCTURE, REQUIRED.
 * - Presentation (Authority: FormConfig): WIDGET, LABEL, WIDTH, VALIDATION, CASCADE, ON_CHANGE.
 * - Sub-Properties: Recursively merges nested object field hierarchies in `PROP`.
 *
 * @param field Presentation form element from visual designer.
 * @param modelProp Matching physical database property definition.
 * @returns Merged canonical FormElement with physical integrity preserved.
 */
export function mergeFieldWithModelProp(
  field: FormElement,
  modelProp?: ModelProperty,
): FormElement {
  if (!modelProp) {
    return field;
  }

  // Recursively merge nested sub-properties for object fields
  let mergedSubProps = field.PROP;
  if (Array.isArray(modelProp.PROP) && modelProp.PROP.length > 0) {
    const findSubProp = modelPropertyMatcher(modelProp.PROP);
    if (Array.isArray(field.PROP) && field.PROP.length > 0) {
      mergedSubProps = field.PROP.map((subF) =>
        mergeFieldWithModelProp(subF, findSubProp(subF.NAME)),
      );
    } else {
      mergedSubProps = modelProp.PROP.map((sp, idx) => modelPropToFormElement(sp, idx));
    }
  }

  const physicalType = (modelProp.TYPE || field.TYPE || "String") as PropertyType;
  const effectiveLength = resolvePhysicalLength(
    physicalType,
    modelProp.LENGTH ?? field.LENGTH,
    DEFAULT_PROPERTY_LENGTH,
  );
  const effectiveStructure = resolvePhysicalStructure(
    physicalType,
    modelProp.STRUCTURE,
    field.STRUCTURE,
  );

  const modelName = (modelProp.MODELNAME || field.MODELNAME || "").trim();
  const effectiveParam = resolveFieldParameter(field.PARAMETER, modelName);

  return {
    ...field,
    // Database schema authority (physical integrity)
    TYPE: physicalType,
    LENGTH: effectiveLength,
    STRUCTURE: effectiveStructure,
    REQUIRED: Boolean(modelProp.REQUIRED) || Boolean(field.REQUIRED),

    // Presentation layer attributes with sensible fallbacks
    LABEL: field.LABEL || formatNameToLabel(modelProp.NAME),
    WIDTH: field.WIDTH ?? deriveSemanticWidth(undefined, modelProp.LENGTH, modelProp.TYPE),
    WIDGET: resolveWidgetType(modelProp.TYPE, effectiveParam, field.WIDGET, effectiveStructure, {
      length: effectiveLength,
      modelName,
    }),
    PARAMETER: effectiveParam,
    ...(modelName ? { MODELNAME: modelName } : {}),

    ...(mergedSubProps && mergedSubProps.length > 0 ? { PROP: mergedSubProps } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Form Specification Compiler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure compiler that harmonizes physical data schemas with presentation layouts.
 * - If `layout` is null/empty: generates a canonical 12-column card fallback layout.
 * - If `layout` is provided: merges visual elements against authoritative model properties.
 *
 * @param model Physical model configuration (sole authority on database schema).
 * @param layout Optional visual layout configuration from form designer.
 * @returns Fully compiled FormConfigRecord ready for FormRenderer consumption.
 */
export function compileFormSpec(
  model: ModelConfigRecord,
  layout?: FormConfigRecord | null,
): FormConfigRecord {
  const modelCode = (model.TABLENAME || "FORM").toUpperCase();

  // Case A: Fallback Layout (No custom sections provided)
  if (!layout?.frmElements?.sections || layout.frmElements.sections.length === 0) {
    return {
      title: model.DESCRIPTION || modelCode,
      description: `Default specification for ${modelCode}`,
      authNumber: 1,
      frmRoutine: {
        rtnValidate: [],
        rtnBeforeAuth: [],
        rtnAfterAuth: [],
      },
      frmElements: {
        density: "compact",
        sections: buildFallbackSections(model),
      },
      auditData: model.auditData,
    };
  }

  // Case B: Custom Layout Composition
  const findProp = modelPropertyMatcher(model.PROPERTIES);

  const cleanSections: FormSection[] = layout.frmElements.sections.map((section) => ({
    ...section,
    columns: section.columns ?? 1,
    fields: (section.fields || []).map((field) =>
      mergeFieldWithModelProp(field, findProp(field.NAME)),
    ),
  }));

  return {
    ...layout,
    title: layout.title || model.DESCRIPTION || modelCode,
    description: layout.description || model.DESCRIPTION || modelCode,
    frmElements: {
      ...(layout.frmElements.layout ? { layout: layout.frmElements.layout } : {}),
      ...(layout.frmElements.density ? { density: layout.frmElements.density } : {}),
      sections: cleanSections,
    },
    auditData: layout.auditData || model.auditData,
  };
}
