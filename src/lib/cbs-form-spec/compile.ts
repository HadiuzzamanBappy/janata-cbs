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
  if (
    typeof prop.WIDTH === "string" &&
    ["xs", "sm", "md", "lg", "xl", "xxl", "full"].includes(prop.WIDTH)
  ) {
    return prop.WIDTH as PropertyWidth;
  }
  if (prop.LENGTH && prop.LENGTH > 100) return "full";
  if (prop.LENGTH && prop.LENGTH > 40) return "lg";
  if (prop.LENGTH && prop.LENGTH <= 5) return "xs";
  if (prop.LENGTH && prop.LENGTH <= 15) return "sm";
  return "md";
}

/**
 * Generates canonical responsive fallback layout sections from a physical ModelConfigRecord.
 * Used when a model has no custom FormConfigRecord layout defined.
 */
export function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const allProps = model.PROPERTIES || [];

  const rootFields: FormElement[] = allProps.map((p, idx) => {
    const snStr = String(p.SN || idx + 1);
    const baseLabel = p.LABEL || p.NAME || `Field #${snStr}`;

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
      POSITION: "",
      PARAMETER: {
        type: "O",
        data: [],
        modelName: "",
        displayField: "",
        condition: "",
        reference: "",
      },
      ENRICHTEXT: "",
      DEFAULTVALUE: "",
    };
  });

  if (rootFields.length === 0) {
    return [];
  }

  return [
    {
      id: "sec_default",
      title: model.DESCRIPTION || model.TABLENAME || "General Attributes",
      description: "Physical Data Dictionary Fields",
      type: "standard",
      zone: "standard",
      layoutStyle: "card",
      columns: 1,
      collapsible: false,
      isCollapsed: false,
      fields: rootFields,
    },
  ];
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
        WIDTH: field.WIDTH || defaultWidthForLength(modelProp),
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
