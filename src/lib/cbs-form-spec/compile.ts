import { flattenModelProperties } from "@/lib/data-parsers";
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
  if (prop.TYPE === "Textarea") return 12;
  if (prop.LENGTH && prop.LENGTH > 60) return 12;
  if (prop.LENGTH && prop.LENGTH <= 15) return 4;
  return 6;
}

/**
 * Generates canonical 12-column responsive fallback sections from a model.
 */
function buildFallbackSections(model: ModelConfigRecord): FormSection[] {
  const allProps = flattenModelProperties(model.PROPERTIES || []);
  const activeProps = allProps;

  // Identify parent Objects and their structure ("S" or "M")
  const objectParents = new Map<string, ModelProperty>();
  for (const p of activeProps) {
    if (p.TYPE === "Object") {
      objectParents.set(p.SN, p);
    }
  }

  // Track first child per group parent
  const seenGroupFirstChild = new Set<string>();

  // Keep all fields inline in natural sequence.
  // Object containers themselves are not input fields, but their child fields are rendered inline.
  // Format numbering: e.g. parent "8", child "8_1" -> label displays with numbering like "8.1".
  const rootFields: FormFieldItem[] = activeProps
    .filter((p) => p.TYPE !== "Object")
    .map((p) => {
      const snStr = String(p.SN ?? "");
      const isGroupChild = snStr.includes("_");
      const parentSn = isGroupChild ? snStr.substring(0, snStr.lastIndexOf("_")) : null;
      const parentObj = parentSn ? objectParents.get(parentSn) : null;

      // Base label from property definition
      const baseLabel = p.LABEL || p.NAME || `Field #${snStr}`;
      // Clean display label without cluttering with parent/child suffix
      const displayLabel = baseLabel;

      // Group metadata:
      // Multi-value ("M") belongs to the parent Object, NOT individual child fields!
      // Each child field keeps its own structure (usually "S").
      const isFirstInGroup = Boolean(parentSn && !seenGroupFirstChild.has(parentSn));
      if (parentSn && isFirstInGroup) {
        seenGroupFirstChild.add(parentSn);
      }

      // Determine colSpan: if p.WIDTH is provided and valid (1..12), use it;
      // otherwise, if p.WIDTH is larger than 12 (e.g. pixels from legacy), or not specified, fallback to colSpanForLength(p) or 12.
      let resolvedColSpan = 12;
      if (typeof p.WIDTH === "number" && p.WIDTH >= 1 && p.WIDTH <= 12) {
        resolvedColSpan = p.WIDTH;
      } else if (p.TYPE === "Textarea") {
        resolvedColSpan = 12;
      } else {
        resolvedColSpan = colSpanForLength(p);
      }

      return {
        id: `f_${p.NAME || p.SN}`,
        fieldKey: p.NAME || `field_${p.SN}`,
        label: displayLabel,
        widget: getDefaultWidget(p.TYPE),
        modelType: p.TYPE,
        length: p.LENGTH,
        structure: p.STRUCTURE || "S", // Keep individual field structure (single)
        groupKey: parentObj?.NAME,
        groupSn: parentSn ?? undefined,
        groupLabel: parentObj?.LABEL || parentObj?.NAME,
        groupStructure: parentObj?.STRUCTURE,
        isFirstInGroup: isFirstInGroup,
        parameter: p.PARAMETER,
        colSpan: Math.min(Math.max(resolvedColSpan, 1), 12),
        required: p.REQUIRED,
        readOnly: p.DISABLED,
        placeholder:
          p.ENRICHTEXT || (p.DEFAULTVALUE !== undefined ? String(p.DEFAULTVALUE) : undefined),
      };
    });

  const sections: FormSection[] = [];

  if (rootFields.length > 0) {
    sections.push({
      id: "sec_default",
      title: model.DESCRIPTION || model.TABLENAME || "General Attributes",
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
  // With append-only model evolution, layouts are directly composed against model properties
  const allProps = flattenModelProperties(model.PROPERTIES || []);
  const propertyMap = new Map(allProps.map((p) => [p.NAME.toLowerCase(), p]));

  // Identify parent Objects and their structure ("S" or "M")
  const objectParents = new Map<string, ModelProperty>();
  for (const p of allProps) {
    if (p.TYPE === "Object") {
      objectParents.set(p.SN, p);
    }
  }
  const seenGroupFirstChild = new Set<string>();

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

      // Resolve group metadata from model property hierarchy
      const propSnStr = String(modelProp.SN ?? "");
      const isGroupChild = propSnStr.includes("_");
      const parentSn = isGroupChild ? propSnStr.substring(0, propSnStr.lastIndexOf("_")) : null;
      const parentObj = parentSn ? objectParents.get(parentSn) : null;

      const isFirstInGroup = Boolean(parentSn && !seenGroupFirstChild.has(parentSn));
      if (parentSn && isFirstInGroup) {
        seenGroupFirstChild.add(parentSn);
      }

      const fieldColSpan =
        typeof field.colSpan === "number" && field.colSpan >= 1 && field.colSpan <= 12
          ? field.colSpan
          : typeof modelProp.WIDTH === "number" && modelProp.WIDTH >= 1 && modelProp.WIDTH <= 12
            ? modelProp.WIDTH
            : 12;

      const resolvedField: FormFieldItem = {
        ...field,
        widget,
        label: field.label || modelProp.LABEL || modelProp.NAME,
        modelType: modelProp.TYPE,
        length: modelProp.LENGTH,
        structure: modelProp.STRUCTURE || field.structure || "S",
        groupKey: parentObj?.NAME || field.groupKey,
        groupSn: parentSn ?? field.groupSn,
        groupLabel: parentObj?.LABEL || parentObj?.NAME || field.groupLabel,
        groupStructure: parentObj?.STRUCTURE || field.groupStructure,
        isFirstInGroup: isFirstInGroup || field.isFirstInGroup,
        colSpan: Math.min(Math.max(fieldColSpan, 1), 12),
        required: modelProp.REQUIRED ?? field.required,
        readOnly: modelProp.DISABLED ?? field.readOnly,
        parameter: modelProp.PARAMETER ?? field.parameter,
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
          TYPE: (f.modelType || "Text") as ModelProperty["TYPE"],
          STRUCTURE: "S" as const,
          LENGTH: f.length || 50,
          REQUIRED: Boolean(f.required),
          DISABLED: Boolean(f.readOnly),
          STATUS: "ACTIVE" as const,
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
      IDDEF: { IDPREFIX: "", IDPATTERN: "", SEQUENCERESET: false },
      PROPERTIES: syntheticProps,
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
