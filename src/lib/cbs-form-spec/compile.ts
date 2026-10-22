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
  if (prop.type === "Textarea") return 12;
  if (prop.length && prop.length > 60) return 12;
  if (prop.length && prop.length <= 15) return 4;
  return 6;
}

/**
 * Generates canonical 12-column responsive fallback sections from a model.
 */
function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const activeProps = (model.properties || []).filter((p) => p.status !== "ARCHIVED");
  const rootProps = activeProps.filter((p) => !p.sn.includes("_"));
  const childProps = activeProps.filter((p) => p.sn.includes("_"));

  const sections: FormSection[] = [];

  // 1. Primary Root Section
  const rootFields: FormFieldItem[] = rootProps
    .filter((p) => p.type !== "Object")
    .map((p) => ({
      id: `f_${p.name || p.sn}`,
      fieldKey: p.name || `field_${p.sn}`,
      label: p.label || p.name || `Field #${p.sn}`,
      widget: getDefaultWidget(p.type),
      modelType: p.type,
      length: p.length,
      parameter: p.parameter,
      colSpan: 12,
      required: p.required,
      readOnly: p.disabled,
      placeholder:
        p.enrichText || (p.defaultValue !== undefined ? String(p.defaultValue) : undefined),
    }));

  if (rootFields.length > 0) {
    sections.push({
      id: "sec_default",
      title: model.description || model.tableName || "General Attributes",
      description: "Raw Model Field Specifications",
      type: "standard",
      zone: "standard",
      layoutStyle: "card",
      columns: 1,
      collapsible: false,
      isCollapsed: false,
      fields: rootFields,
    });
  }

  // 2. Structured Objects and Repeating Sub-Tables
  const objectParents = rootProps.filter((p) => p.type === "Object");
  for (const obj of objectParents) {
    const prefix = `${obj.sn}_`;
    const children = childProps.filter((cp) => cp.sn.startsWith(prefix));
    const isMulti = obj.structure === "M";

    const childFields: FormFieldItem[] = children.map((c) => ({
      id: `f_${c.name || c.sn}`,
      fieldKey: c.name || `child_${c.sn}`,
      label: c.label || c.name || `Child #${c.sn}`,
      widget: getDefaultWidget(c.type),
      modelType: c.type,
      length: c.length,
      parameter: c.parameter,
      colSpan: 12,
      required: c.required,
      readOnly: c.disabled,
      placeholder: c.enrichText,
    }));

    sections.push({
      id: `sec_obj_${obj.sn}`,
      title: obj.label || obj.name || "Object Group",
      description: isMulti ? "Repeatable multi-row table" : "Child field group",
      type: isMulti ? "array-table" : "object-group",
      zone: "standard",
      layoutStyle: "card",
      bindKey: obj.name || `obj_${obj.sn}`,
      columns: isMulti ? 2 : 1,
      collapsible: true,
      isCollapsed: false,
      fields: childFields,
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
  const modelCode = (model.tableName || model.recordId || "FORM").toUpperCase();
  const idPrefix = model.idDef?.idPrefix || model.prefix || modelCode.slice(0, 2);

  // Case A: Uncustomized / Fallback Layout
  if (!layout) {
    const sections = buildFallbackSections(model);
    const flatFields = sections.flatMap((s) => s.fields);

    return compiledFormSpecSchema.parse({
      code: modelCode,
      title: model.description || modelCode,
      targetModel: modelCode,
      version: "1.0.0",
      layoutSource: "fallback",
      isStale: false,
      idPrefix,
      idDef: model.idDef,
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
  // With append-only model evolution, layouts are directly composed against model properties
  const propertyMap = new Map((model.properties || []).map((p) => [p.name.toLowerCase(), p]));

  const cleanSections: FormSection[] = [];
  const flatFields: FormFieldItem[] = [];

  for (const section of layout.presentation?.sections || []) {
    const cleanFields: FormFieldItem[] = [];

    for (const field of section.fields || []) {
      const modelProp = propertyMap.get(field.fieldKey.toLowerCase());

      // DROP ARCHIVED OR MISSING FIELDS AT RUNTIME
      if (!modelProp || modelProp.status === "ARCHIVED") {
        continue;
      }

      // Re-synchronize validation rules and safe widget fallback
      const currentWidget = field.widget as FormWidgetType;
      const widget = isWidgetCompatible(modelProp.type, currentWidget)
        ? currentWidget
        : getDefaultWidget(modelProp.type);

      const resolvedField: FormFieldItem = {
        ...field,
        widget,
        label: field.label || modelProp.label || modelProp.name,
        modelType: modelProp.type,
        length: modelProp.length,
        required: modelProp.required ?? field.required,
        readOnly: modelProp.disabled ?? field.readOnly,
        parameter: modelProp.parameter ?? field.parameter,
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
    title: layout.title || model.description || modelCode,
    targetModel: modelCode,
    version: layout.version || "1.0.0",
    layoutSource: "custom",
    isStale: false,
    idPrefix,
    idDef: model.idDef,
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
 * - If it has `properties` -> compiles as Model Schema with responsive 12-col fallback
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
          sn: String(idx + 1),
          name: f.fieldKey,
          label: f.label,
          type: (f.modelType || "Text") as ModelProperty["type"],
          structure: "S",
          length: f.length || 50,
          required: Boolean(f.required),
          disabled: Boolean(f.readOnly),
          status: "ACTIVE",
        })),
    );

    const syntheticModel: ModelConfigRecord = {
      tableName: String(formConfig.targetModel || formConfig.recordId || "FORM"),
      description: String(formConfig.title || "Form"),
      servicePath: "default",
      access: "G",
      properties: syntheticProps,
    } as unknown as ModelConfigRecord;

    return compileFormSpec(syntheticModel, formConfig);
  }

  // 2. Is it a Model Config? (Has `properties`)
  if ("properties" in rec && Array.isArray(rec.properties)) {
    const modelConfig = rec as unknown as ModelConfigRecord;
    return compileFormSpec(modelConfig, null);
  }

  throw new Error("Unknown schema format: payload has neither 'properties' nor 'presentation'");
}

