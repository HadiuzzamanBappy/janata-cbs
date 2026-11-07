import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";
import {
  defaultWidthForLength,
  modelPropToFormElement,
  normalizeParameter,
  resolveWidgetType,
} from "./field-normalizer";

/* -------------------------------------------------------------------------- */
/* Fallback Layout Generator (Single Responsibility: Model -> Default Layout)  */
/* -------------------------------------------------------------------------- */

/**
 * Generates canonical responsive fallback layout sections from a physical ModelConfigRecord.
 * Preserves strict creation order of properties. Object types are compiled as inline
 * "object-group" sections with their nested child fields.
 */
export function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const allProps = model.PROPERTIES || [];
  if (allProps.length === 0) return [];

  const fields: FormElement[] = allProps.map((p, idx) => modelPropToFormElement(p, idx));

  return [
    {
      id: "sec_std_1",
      title: model.DESCRIPTION || model.TABLENAME || "General Attributes",
      description: "",
      containerType: "plain",
      columns: 1,
      collapsible: false,
      isCollapsed: false,
      fields,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Master Form Specification Compiler (Single Responsibility: Merge Layout)    */
/* -------------------------------------------------------------------------- */

/**
 * Pure, authoritative compiler for the CBS presentation layer.
 * Merges a ModelConfigRecord (physical DB authority) with an optional
 * FormConfigRecord layout (visual arrangement). If no custom layout is supplied,
 * generates a 12-column responsive fallback grid.
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
        sections: buildFallbackSections(model),
      },
      auditData: model.auditData,
    };
  }

  // Case B: Custom Layout Composition
  // Physical model property constraints (REQUIRED, LENGTH, TYPE) are authoritative
  const propertyMap = new Map(
    (model.PROPERTIES || []).map((p: ModelProperty) => [p.NAME.toLowerCase(), p]),
  );

  const cleanSections: FormSection[] = layout.frmElements.sections.map((section) => ({
    ...section,
    columns: section.columns ?? 1,
    fields: (section.fields || []).map((field) => {
      const modelProp = propertyMap.get(field.NAME.toLowerCase());
      if (!modelProp) {
        return field;
      }

      return {
        ...field,
        LABEL: field.LABEL || modelProp.LABEL || modelProp.NAME,
        TYPE: field.TYPE || modelProp.TYPE || "Text",
        LENGTH: field.LENGTH || modelProp.LENGTH || 35,
        STRUCTURE: field.STRUCTURE || modelProp.STRUCTURE || "S",
        // Invariant: ModelConfig is physical database authority.
        REQUIRED: Boolean(modelProp.REQUIRED) || Boolean(field.REQUIRED),
        WIDTH: field.WIDTH ?? defaultWidthForLength(modelProp),
        WIDGET: resolveWidgetType(modelProp.TYPE, modelProp.PARAMETER, field.WIDGET),
        PARAMETER:
          field.PARAMETER?.data && field.PARAMETER.data.length > 0
            ? field.PARAMETER
            : modelProp.PARAMETER
              ? normalizeParameter(modelProp.PARAMETER)
              : field.PARAMETER,
        VALIDATION: field.VALIDATION,
        VISIBLE_WHEN: field.VISIBLE_WHEN,
        DISABLED_WHEN: field.DISABLED_WHEN,
      };
    }),
  }));

  return {
    ...layout,
    title: layout.title || model.DESCRIPTION || modelCode,
    description: layout.description || model.DESCRIPTION || modelCode,
    frmElements: {
      sections: cleanSections,
    },
    auditData: layout.auditData || model.auditData,
  };
}
