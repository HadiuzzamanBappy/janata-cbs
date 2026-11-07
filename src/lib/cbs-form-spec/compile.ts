import { getDefaultWidgetForType, isWidgetCompatibleWithType } from "@/lib/data-schemas";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement, PropertyWidth } from "@/lib/data-schemas/form-engine-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export type CompiledFormSpec = FormConfigRecord;

/* -------------------------------------------------------------------------- */
/* Layout Generation Utilities                                                */
/* -------------------------------------------------------------------------- */

/**
 * Computes optimal semantic width token from model property attributes (TYPE and physical LENGTH).
 * Maps directly to the canonical 12-column responsive tokens: xs, sm, md, lg, xl, full.
 */
export function defaultWidthForLength(prop: ModelProperty): PropertyWidth {
  // 1. Type-based semantic defaults
  const normType = (prop.TYPE || "").toLowerCase();
  if (normType === "textarea") return "full";
  if (normType === "boolean" || normType === "switch" || normType === "checkbox") return "xs";
  if (normType === "date" || normType === "datetime") return "sm";
  if (normType === "amount" || normType === "rate") return "md";

  // 2. Physical DB length fallback
  // Single-line inputs cap comfortably at xxl (max-w-2xl) instead of stretching
  // across the full widescreen terminal. Only textareas take "full" (100% width).
  const len = prop.LENGTH;
  if (typeof len === "number" && len > 0) {
    if (len <= 6) return "xs";
    if (len <= 16) return "sm";
    if (len <= 40) return "md";
    if (len <= 80) return "lg";
    if (len <= 150) return "xl";
    return "xxl";
  }

  return "md";
}

function normalizeParameter(raw?: Record<string, unknown> | null): FormElement["PARAMETER"] {
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

function modelPropToFormElement(p: ModelProperty, idx: number): FormElement {
  const snStr = String(p.SN || idx + 1);
  const baseLabel = p.LABEL || p.NAME || `Field #${snStr}`;
  const param = normalizeParameter(p.PARAMETER);
  const hasLookup = Boolean(
    param?.type === "M" || (param?.type === "O" && param.data && param.data.length > 0),
  );
  const defaultWidget = hasLookup ? "select" : getDefaultWidgetForType(p.TYPE);
  const explicitWidget = (p as Record<string, unknown>).WIDGET as string | undefined;
  const effectiveWidget =
    explicitWidget && isWidgetCompatibleWithType(p.TYPE, explicitWidget)
      ? (explicitWidget as FormElement["WIDGET"])
      : defaultWidget;

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
    VISIBLE_WHEN: (p as Record<string, unknown>).VISIBLE_WHEN as FormElement["VISIBLE_WHEN"],
    DISABLED_WHEN: (p as Record<string, unknown>).DISABLED_WHEN as FormElement["DISABLED_WHEN"],
  };
}

/**
 * Generates canonical responsive fallback layout sections from a physical ModelConfigRecord.
 * Preserves strict creation order of properties. Object types are compiled as inline
 * "object-group" sections with their nested child fields.
 */
export function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const allProps = model.PROPERTIES || [];
  if (allProps.length === 0) return [];

  const sections: FormSection[] = [];
  let currentStandardFields: FormElement[] = [];

  const flushStandardFields = (index: number) => {
    if (currentStandardFields.length > 0) {
      sections.push({
        id: `sec_std_${index}`,
        title: index === 0 ? model.DESCRIPTION || model.TABLENAME || "General Attributes" : "",
        description: "",
        type: "standard",
        zone: "standard",
        layoutStyle: "plain",
        columns: 1,
        collapsible: false,
        isCollapsed: false,
        fields: [...currentStandardFields],
      });
      currentStandardFields = [];
    }
  };

  allProps.forEach((p, idx) => {
    if (p.TYPE === "Object") {
      flushStandardFields(idx);
      const subFields = Array.isArray(p.PROP)
        ? p.PROP.map((sub, sIdx) => modelPropToFormElement(sub, sIdx))
        : [];
      sections.push({
        id: `sec_${p.NAME.toLowerCase() || idx}`,
        title: p.LABEL || p.NAME,
        description: `Nested group for ${p.LABEL || p.NAME}`,
        type: "object-group",
        zone: "standard",
        layoutStyle: "plain",
        columns: 1,
        structure: p.STRUCTURE || "S",
        bindKey: p.NAME,
        collapsible: false,
        isCollapsed: false,
        fields: subFields,
      });
    } else {
      currentStandardFields.push(modelPropToFormElement(p, idx));
    }
  });

  flushStandardFields(allProps.length);

  return sections;
}

/* -------------------------------------------------------------------------- */
/* Master Form Specification Compiler                                         */
/* -------------------------------------------------------------------------- */

/**
 * Pure, authoritative compiler for the CBS presentation layer.
 * Merges a ModelConfigRecord (the single authority on data schema) with an optional
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
        steps: [],
        sections: buildFallbackSections(model),
      },
      auditData: model.auditData,
    };
  }

  // Case B: Custom Layout Composition
  // Physical model property constraints (REQUIRED, LENGTH, TYPE) are authoritative
  const propertyMap = new Map((model.PROPERTIES || []).map((p) => [p.NAME.toLowerCase(), p]));

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
        WIDGET:
          field.WIDGET && isWidgetCompatibleWithType(modelProp.TYPE, field.WIDGET)
            ? field.WIDGET
            : getDefaultWidgetForType(modelProp.TYPE),
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
      steps: layout.frmElements.steps || [],
      sections: cleanSections,
    },
    auditData: layout.auditData || model.auditData,
  };
}
