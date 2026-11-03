import type {
  FormConfigRecord,
  FormElement,
  FormSection,
} from "@/lib/data-schemas/form-config-schema";
import type {
  ModelConfigRecord,
  ModelProperty,
  PropertyWidth,
} from "@/lib/data-schemas/model-config-schema";

export type CompiledFormSpec = FormConfigRecord;

/* -------------------------------------------------------------------------- */
/* Layout Generation Utilities                                                */
/* -------------------------------------------------------------------------- */

/**
 * Computes optimal semantic width token from model property attributes.
 * Aligns with the 7 canonical CBS responsive tokens: xs, sm, md, lg, xl, xxl, full.
 */
export function defaultWidthForLength(prop: ModelProperty): PropertyWidth {
  if (typeof prop.WIDTH === "number" && prop.WIDTH > 0) {
    return prop.WIDTH;
  }
  if (prop.LENGTH && prop.LENGTH > 100) return 1000;
  if (prop.LENGTH && prop.LENGTH > 40) return 450;
  if (prop.LENGTH && prop.LENGTH <= 5) return 120;
  if (prop.LENGTH && prop.LENGTH <= 15) return 180;
  return 280;
}

function normalizeParameter(raw?: Record<string, unknown> | null): FormElement["PARAMETER"] {
  if (!raw) {
    return {
      type: "O",
      data: [],
      modelName: "",
      displayField: "",
      condition: "",
      reference: "",
    };
  }
  const rawData = Array.isArray(raw.data) ? raw.data : [];
  const normalizedData = rawData.map((item) => {
    const d = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      code: String(d.code || d.itemCode || d.value || ""),
      label: String(d.label || d.itemLabel || d.name || d.code || d.itemCode || ""),
      ...d,
    };
  });
  return {
    type: String(raw.type || "O"),
    data: normalizedData,
    modelName: String(raw.modelName || ""),
    codeField: String(raw.codeField || raw.valueField || ""),
    displayField: String(raw.displayField || ""),
    condition: String(raw.condition || ""),
    reference: String(raw.reference || ""),
  };
}

function modelPropToFormElement(p: ModelProperty, idx: number): FormElement {
  const snStr = String(p.SN || idx + 1);
  const baseLabel = p.LABEL || p.NAME || `Field #${snStr}`;
  const widget = p.TYPE === "Dropdown" ? "select" : p.TYPE === "Boolean" ? "checkbox" : undefined;

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
    WIDGET: widget,
    PARAMETER: normalizeParameter(p.PARAMETER),
    POSITION: "",
    ENRICHTEXT: "",
    DEFAULTVALUE: "",
  };
}

/**
 * Generates canonical responsive fallback layout sections from a physical ModelConfigRecord.
 * Used when a model has no custom FormConfigRecord layout defined.
 */
export function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const allProps = model.PROPERTIES || [];
  if (allProps.length === 0) return [];

  const standardFields: FormElement[] = [];
  const objectSections: FormSection[] = [];

  allProps.forEach((p, idx) => {
    if (p.TYPE === "Object" && p.PROP && p.PROP.length > 0) {
      objectSections.push({
        id: `sec_${p.NAME.toLowerCase()}`,
        title: p.LABEL || p.NAME,
        description: `Nested group for ${p.LABEL || p.NAME}`,
        type: "object-group",
        zone: "standard",
        layoutStyle: "card",
        columns: 1,
        structure: p.STRUCTURE || "S",
        bindKey: p.NAME,
        collapsible: true,
        isCollapsed: false,
        fields: p.PROP.map((sub, sIdx) => modelPropToFormElement(sub, sIdx)),
      });
    } else {
      standardFields.push(modelPropToFormElement(p, idx));
    }
  });

  const sections: FormSection[] = [];
  if (standardFields.length > 0) {
    sections.push({
      id: "sec_default",
      title: model.DESCRIPTION || model.TABLENAME || "General Attributes",
      description: "Physical Data Dictionary Fields",
      type: "standard",
      zone: "standard",
      layoutStyle: "card",
      columns: 1,
      collapsible: false,
      isCollapsed: false,
      fields: standardFields,
    });
  }

  return [...sections, ...objectSections];
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
          field.WIDGET ||
          (modelProp.TYPE === "Dropdown"
            ? "select"
            : modelProp.TYPE === "Boolean"
              ? "checkbox"
              : undefined),
        PARAMETER:
          field.PARAMETER?.data && field.PARAMETER.data.length > 0
            ? field.PARAMETER
            : modelProp.PARAMETER
              ? normalizeParameter(modelProp.PARAMETER)
              : field.PARAMETER,
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
