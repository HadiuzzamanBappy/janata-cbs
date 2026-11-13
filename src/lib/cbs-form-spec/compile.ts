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
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";
import {
  defaultWidthForLength,
  modelPropToFormElement,
  resolveWidgetType,
} from "./field-normalizer";

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Layout Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds canonical 12-column responsive fallback sections from a physical ModelConfigRecord.
 * Preserves definition order and compiles nested properties into inline sub-groups.
 *
 * @param model Physical model configuration from backend core.
 * @returns Standard single-section card layout containing all model fields.
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
    const subPropMap = new Map(modelProp.PROP.map((sp) => [sp.NAME.toLowerCase(), sp]));
    if (Array.isArray(field.PROP) && field.PROP.length > 0) {
      mergedSubProps = field.PROP.map((subF) =>
        mergeFieldWithModelProp(subF, subPropMap.get(subF.NAME.toLowerCase())),
      );
    } else {
      mergedSubProps = modelProp.PROP.map((sp, idx) => modelPropToFormElement(sp, idx));
    }
  }

  return {
    ...field,
    // Database schema authority (physical integrity)
    TYPE: modelProp.TYPE || field.TYPE || "String",
    LENGTH: modelProp.LENGTH || field.LENGTH || 35,
    STRUCTURE: modelProp.STRUCTURE || field.STRUCTURE || "S",
    REQUIRED: Boolean(modelProp.REQUIRED) || Boolean(field.REQUIRED),

    // Presentation layer attributes with sensible fallbacks
    LABEL: field.LABEL || formatNameToLabel(modelProp.NAME),
    WIDTH: field.WIDTH ?? defaultWidthForLength(modelProp),
    WIDGET: resolveWidgetType(modelProp.TYPE, field.PARAMETER, field.WIDGET),

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
        columns: 1,
        density: "compact",
        sections: buildFallbackSections(model),
      },
      auditData: model.auditData,
    };
  }

  // Case B: Custom Layout Composition
  const propertyMap = new Map(
    (model.PROPERTIES || []).map((p: ModelProperty) => [p.NAME.toLowerCase(), p]),
  );

  const cleanSections: FormSection[] = layout.frmElements.sections.map((section) => ({
    ...section,
    columns: section.columns ?? 1,
    fields: (section.fields || []).map((field) =>
      mergeFieldWithModelProp(field, propertyMap.get(field.NAME.toLowerCase())),
    ),
  }));

  return {
    ...layout,
    title: layout.title || model.DESCRIPTION || modelCode,
    description: layout.description || model.DESCRIPTION || modelCode,
    frmElements: {
      ...(layout.frmElements.columns ? { columns: layout.frmElements.columns } : {}),
      ...(layout.frmElements.density ? { density: layout.frmElements.density } : {}),
      sections: cleanSections,
    },
    auditData: layout.auditData || model.auditData,
  };
}
