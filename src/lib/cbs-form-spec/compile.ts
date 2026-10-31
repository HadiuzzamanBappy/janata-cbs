import type {
  FormConfigRecord,
  FormElement,
  FormElementsContainer,
  FormSection,
  RoutineItem,
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
 * Computes optimal semantic width token from length or semantic token.
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
 * Generates canonical fallback sections from a model dictionary.
 */
function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
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
      VALUE: "",
      FIXEDVALUE: "",
      ISOPEN: false,
      ISLOADING: false,
      PROP: [],
      DATASOURCE: [],
      DEFAULTVALUE: "",
    };
  });

  const sections: FormSection[] = [];

  if (rootFields.length > 0) {
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
      fields: rootFields,
    });
  }

  return sections;
}

/* -------------------------------------------------------------------------- */
/* Master Form Specification Compiler                                         */
/* -------------------------------------------------------------------------- */

/**
 * Single authoritative form compiler for the CBS presentation layer.
 * Merges a ModelConfigRecord with an authorized FormConfigRecord layout
 * (or generates canonical fallback sections when layout is null or empty).
 */
export function compileFormSpec(
  model: ModelConfigRecord,
  layout: FormConfigRecord | null,
): FormConfigRecord {
  const modelCode = (model.TABLENAME || "FORM").toUpperCase();

  // Case A: Uncustomized / Fallback Layout
  if (!layout?.frmElements?.sections || layout.frmElements.sections.length === 0) {
    const sections = buildFallbackSections(model);

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
        sections,
      },
      auditData: model.auditData,
    };
  }

  // Case B: Custom Layout Composition
  // Layouts are composed directly against physical model properties
  const allProps = model.PROPERTIES || [];
  const propertyMap = new Map(allProps.map((p) => [p.NAME.toLowerCase(), p]));

  const cleanSections: FormSection[] = (layout.frmElements.sections || []).map((section) => {
    const cleanFields: FormElement[] = (section.fields || []).map((field) => {
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
        REQUIRED: field.REQUIRED !== undefined ? field.REQUIRED : Boolean(modelProp.REQUIRED),
        WIDTH: field.WIDTH || defaultWidthForLength(modelProp),
      };
    });

    return {
      ...section,
      fields: cleanFields,
    };
  });

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

/**
 * Structural / Duck-Typing Form Resolver:
 * Introspects the raw record returned from Core:
 * - If it has `frmElements` -> compiles as Custom Form Layout
 * - If it has `PROPERTIES` -> compiles as Model Schema with responsive fallback
 */
export function resolveFormRecord(
  record: unknown,
  fallbackModel?: ModelConfigRecord | null,
): FormConfigRecord {
  if (!record || typeof record !== "object") {
    throw new Error("Invalid schema payload received from core backend");
  }

  const rec = record as Record<string, unknown>;

  // 0. Is it a Combined GFC Payload? (Has `FORMCONTROL`)
  if ("FORMCONTROL" in rec && rec.FORMCONTROL && typeof rec.FORMCONTROL === "object") {
    const fc = rec.FORMCONTROL as Record<string, unknown>;
    const model = Array.isArray(rec.PROPERTIES)
      ? (rec as unknown as ModelConfigRecord)
      : fallbackModel;

    const hasLayout = Object.keys(fc).length > 0 && ("frmElements" in fc || "title" in fc);

    if (hasLayout) {
      return resolveFormRecord(fc, model);
    }
    if (model) {
      return compileFormSpec(model, null);
    }
  }

  // 1. Is it a Form Config? (Has `frmElements`)
  if ("frmElements" in rec) {
    const rawContainer = rec.frmElements as FormElementsContainer;
    const formConfig: FormConfigRecord = {
      title: String(rec.title || rec.description || ""),
      description: String(rec.description || rec.title || ""),
      authNumber: Number(rec.authNumber || 1),
      frmRoutine: {
        rtnValidate: Array.isArray((rec.frmRoutine as Record<string, unknown>)?.rtnValidate)
          ? ((rec.frmRoutine as Record<string, unknown>).rtnValidate as RoutineItem[])
          : [],
        rtnBeforeAuth: Array.isArray((rec.frmRoutine as Record<string, unknown>)?.rtnBeforeAuth)
          ? ((rec.frmRoutine as Record<string, unknown>).rtnBeforeAuth as RoutineItem[])
          : [],
        rtnAfterAuth: Array.isArray((rec.frmRoutine as Record<string, unknown>)?.rtnAfterAuth)
          ? ((rec.frmRoutine as Record<string, unknown>).rtnAfterAuth as RoutineItem[])
          : [],
      },
      auditData: rec.auditData as FormConfigRecord["auditData"],
      frmElements: {
        steps: rawContainer?.steps || [],
        sections: rawContainer?.sections || [],
      },
    };

    if (fallbackModel) {
      return compileFormSpec(fallbackModel, formConfig);
    }
    return formConfig;
  }

  // 2. Is it a Model Config? (Has `PROPERTIES`)
  if (Array.isArray(rec.PROPERTIES)) {
    const modelConfig = rec as unknown as ModelConfigRecord;
    return compileFormSpec(modelConfig, null);
  }

  throw new Error("Unknown schema format: payload has neither 'PROPERTIES' nor 'frmElements'");
}
