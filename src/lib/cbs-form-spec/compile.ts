import {
  type CompiledFormSpec,
  compiledFormSpecSchema,
  type FormConfigRecord,
  type FormFieldItem,
  type FormSection,
  type FormWidgetType,
  getDefaultWidget,
  isWidgetCompatible,
  type ModelConfigRecord,
  type ModelProperty,
} from "@/lib/data-schemas";

/* -------------------------------------------------------------------------- */
/* Layout Generation Utilities                                                */
/* -------------------------------------------------------------------------- */

/**
 * Computes optimal 12-column grid span based on model property type and length.
 */
export function colSpanForLength(prop: ModelProperty): number {
  if (prop.LENGTH && prop.LENGTH > 60) return 12;
  if (prop.LENGTH && prop.LENGTH <= 15) return 4;
  return 6;
}

/**
 * Generates canonical 12-column responsive fallback sections from a model.
 */
function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const allProps = model.PROPERTIES || [];

  const rootFields: FormFieldItem[] = allProps.map((p) => {
    const snStr = String(p.SN ?? "");
    const baseLabel = p.LABEL || p.NAME || `Field #${snStr}`;

    let resolvedColSpan = 12;
    if (typeof p.WIDTH === "number" && p.WIDTH >= 1 && p.WIDTH <= 12) {
      resolvedColSpan = p.WIDTH;
    } else {
      resolvedColSpan = colSpanForLength(p);
    }

    return {
      id: `f_${p.NAME || p.SN}`,
      fieldKey: p.NAME || `field_${p.SN}`,
      label: baseLabel,
      widget: getDefaultWidget(p.TYPE),
      modelType: p.TYPE,
      length: p.LENGTH,
      structure: p.STRUCTURE || "S",
      colSpan: Math.min(Math.max(resolvedColSpan, 1), 12),
      required: p.REQUIRED,
      readOnly: false,
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
 * (or generates a responsive 12-column fallback when layout is null).
 */
export function compileFormSpec(
  model: ModelConfigRecord,
  layout: FormConfigRecord | null,
): CompiledFormSpec {
  const modelCode = (model.TABLENAME || "FORM").toUpperCase();
  const idPrefix = model.IDDEF?.IDPREFIX || model.PREFIX || modelCode.slice(0, 2);

  // Case A: Uncustomized / Fallback Layout
  if (!layout) {
    const sections = buildFallbackSections(model);
    const flatFields = sections.flatMap((s) => s.fields);

    return compiledFormSpecSchema.parse({
      code: modelCode,
      title: model.DESCRIPTION || modelCode,
      targetModel: modelCode,
      version: "1.0.0",
      layoutSource: "fallback",
      isStale: false,
      idPrefix,
      idDef: model.IDDEF,
      fields: flatFields,
      presentation: {
        archetype: "grid",
        density: "compact",
        steps: [],
        sections,
      },
      auditData: model.auditData,
    });
  }

  // Case B: Custom Layout Composition
  // Layouts are composed directly against physical model properties
  const allProps = model.PROPERTIES || [];
  const propertyMap = new Map(allProps.map((p) => [p.NAME.toLowerCase(), p]));

  const cleanSections: FormSection[] = [];
  const flatFields: FormFieldItem[] = [];

  for (const section of layout.presentation?.sections || []) {
    const cleanFields: FormFieldItem[] = [];

    for (const field of section.fields || []) {
      const modelProp = propertyMap.get(field.fieldKey.toLowerCase());

      // DROP MISSING FIELDS AT RUNTIME
      if (!modelProp) {
        continue;
      }

      // Re-synchronize validation rules and safe widget fallback
      const currentWidget = field.widget as FormWidgetType;
      const widget = isWidgetCompatible(modelProp.TYPE, currentWidget)
        ? currentWidget
        : getDefaultWidget(modelProp.TYPE);

      const fieldColSpan =
        typeof field.colSpan === "number" && field.colSpan >= 1 && field.colSpan <= 12
          ? field.colSpan
          : typeof modelProp.WIDTH === "number" && modelProp.WIDTH >= 1 && modelProp.WIDTH <= 12
            ? modelProp.WIDTH
            : colSpanForLength(modelProp);

      const resolvedField: FormFieldItem = {
        ...field,
        widget,
        label: field.label || modelProp.LABEL || modelProp.NAME,
        modelType: modelProp.TYPE,
        length: modelProp.LENGTH,
        structure: modelProp.STRUCTURE || field.structure || "S",
        colSpan: Math.min(Math.max(fieldColSpan, 1), 12),
        required: modelProp.REQUIRED ?? field.required,
        readOnly: field.readOnly ?? false,
      };

      cleanFields.push(resolvedField);
      flatFields.push(resolvedField);
    }

    cleanSections.push({
      ...section,
      fields: cleanFields,
    });
  }

  return compiledFormSpecSchema.parse({
    code: layout.recordId || modelCode,
    title: layout.title || model.DESCRIPTION || modelCode,
    targetModel: modelCode,
    version: layout.version || "1.0.0",
    layoutSource: "custom",
    isStale: false,
    idPrefix,
    idDef: model.IDDEF,
    fields: flatFields,
    presentation: {
      archetype: layout.presentation?.archetype || "grid",
      density: layout.presentation?.density || "compact",
      steps: layout.presentation?.steps || [],
      sections: cleanSections,
    },
    auditData: layout.auditData || model.auditData,
  });
}

/**
 * Structural / Duck-Typing Form Resolver:
 * Introspects the raw record returned from Core:
 * - If it has `presentation` -> compiles as Custom Form Layout
 * - If it has `PROPERTIES` -> compiles as Model Schema with responsive 12-col fallback
 */
export function resolveFormRecord(
  record: unknown,
  fallbackModel?: ModelConfigRecord | null,
): CompiledFormSpec {
  if (!record || typeof record !== "object") {
    throw new Error("Invalid schema payload received from core backend");
  }

  const rec = record as Record<string, unknown>;

  // 1. Is it a Form Config? (Has `presentation`)
  if ("presentation" in rec && rec.presentation) {
    const formConfig = rec as unknown as FormConfigRecord;
    if (fallbackModel) {
      return compileFormSpec(fallbackModel, formConfig);
    }
    // If no explicit model passed, build a synthetic model from the form fields
    const syntheticProps: ModelProperty[] = (formConfig.presentation?.sections || []).flatMap(
      (sec) =>
        (sec.fields || []).map((f, idx) => ({
          SN: String(idx + 1),
          NAME: f.fieldKey,
          LABEL: f.label,
          TYPE: (f.modelType === "Number" || f.modelType === "Date"
            ? f.modelType
            : "Text") as ModelProperty["TYPE"],
          STRUCTURE: "S" as const,
          LENGTH: f.length || 50,
          REQUIRED: Boolean(f.required),
          WIDTH: 200,
        })),
    );

    const syntheticModel: ModelConfigRecord = {
      TABLENAME: String(formConfig.targetModel || formConfig.recordId || "FORM"),
      DESCRIPTION: String(formConfig.title || "Form"),
      PREFIX: "",
      SERVICEPATH: "default",
      USERDEFINEID: false,
      ACCESS: "G",
      SEARCHABLE: false,
      READONLY: false,
      AUTHORIZE: false,
      ASSOCIATES: [],
      _DEVBY: "",
      _DEVDATE: "",
      IDDEF: { IDPREFIX: "", IDPATTERN: "", SEQUENCERESET: false, SEQUENCELENGTH: "" },
      PROPERTIES: syntheticProps,
      VIEWDEF: [],
      IDROUTINE: "",
      FIELDBASED: false,
    };

    return compileFormSpec(syntheticModel, formConfig);
  }

  // 2. Is it a Model Config? (Has `PROPERTIES`)
  const rawProps = rec.PROPERTIES;
  if (Array.isArray(rawProps)) {
    const modelConfig = rec as unknown as ModelConfigRecord;
    return compileFormSpec(modelConfig, null);
  }

  throw new Error("Unknown schema format: payload has neither 'PROPERTIES' nor 'presentation'");
}
