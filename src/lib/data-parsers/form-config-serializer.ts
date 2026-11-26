import {
  DEFAULT_PROPERTY_LENGTH,
  type FormConfigRecord,
  type FormElement,
  type FormSection,
  type PropertyType,
  resolvePhysicalLength,
  resolvePhysicalStructure,
} from "@/lib/data-schemas";

/* -------------------------------------------------------------------------- */
/* Outbound Database Serializers & Physical Form Sanitizers                   */
/* -------------------------------------------------------------------------- */

const TEXT_OVERRIDES = ["ENRICHTEXT", "FIXEDVALUE", "DEFAULTVALUE"] as const;
const SECTION_STRINGS = ["title", "description", "groupId", "groupTitle"] as const;

/**
 * Sanitizes a FormElement for database persistence and wire JSON output:
 * - Removes client-only identifiers (`id: "f_..."`)
 * - Omits default falsy flags (`REQUIRED: false`, `DISABLED: false`); keeps any set `WIDTH`
 * - Omits empty text overrides and compresses sparse JSON
 */
function sanitizeFormElement(field: FormElement): FormElement {
  const { id: _clientId, ...cleanField } = field as FormElement & { id?: string };

  const normType = (cleanField.TYPE || "String") as PropertyType;
  const normLength = resolvePhysicalLength(normType, cleanField.LENGTH, DEFAULT_PROPERTY_LENGTH);
  const normStructure = resolvePhysicalStructure(normType, undefined, cleanField.STRUCTURE);

  const sanitized: Partial<FormElement> = {
    SN: String(cleanField.SN || "1").trim(),
    NAME: cleanField.NAME.trim(),
    LABEL: (cleanField.LABEL || cleanField.NAME).trim(),
    TYPE: normType,
    STRUCTURE: normStructure,
    LENGTH: normLength,
  };

  if (cleanField.REQUIRED) sanitized.REQUIRED = true;
  if (cleanField.DISABLED) sanitized.DISABLED = true;
  // Kept whenever set: an unset width is derived from LENGTH on load, so "md" is not a default
  if (cleanField.WIDTH) sanitized.WIDTH = cleanField.WIDTH;
  if (cleanField.WIDGET) sanitized.WIDGET = cleanField.WIDGET;
  if (cleanField.MODELNAME) sanitized.MODELNAME = String(cleanField.MODELNAME).trim().toUpperCase();

  for (const key of TEXT_OVERRIDES) {
    const val = cleanField[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      sanitized[key] = String(val).trim();
    }
  }

  if (cleanField.ON_CHANGE?.target?.trim()) {
    sanitized.ON_CHANGE = {
      target: cleanField.ON_CHANGE.target.trim(),
      action: cleanField.ON_CHANGE.action || "copy",
      ...(cleanField.ON_CHANGE.delimiter ? { delimiter: cleanField.ON_CHANGE.delimiter } : {}),
    };
  }

  if (cleanField.VALIDATION) {
    const v = cleanField.VALIDATION;
    const cleanVal: Partial<typeof v> = {};
    if (v.matches?.trim()) cleanVal.matches = v.matches.trim();
    if (v.message?.trim()) cleanVal.message = v.message.trim();
    if (typeof v.min === "number") cleanVal.min = v.min;
    if (typeof v.max === "number") cleanVal.max = v.max;
    if (Object.keys(cleanVal).length > 0) {
      sanitized.VALIDATION = cleanVal as typeof v;
    }
  }

  const p = cleanField.PARAMETER;
  const pType = String(p?.type ?? "").toUpperCase();
  const rawModel = String(p?.modelName ?? "").trim() || (pType === "A" ? "LOOKUP" : "");
  if ((pType === "M" || pType === "A") && rawModel) {
    const codeStr = String(p?.codeField ?? "").trim();
    const dispStr = String(p?.displayField ?? "").trim();
    const condStr = String(p?.condition ?? "").trim();
    const recIdStr = String(p?.recordId ?? "").trim();
    const arrFieldStr = String(p?.arrayField ?? "").trim();
    sanitized.PARAMETER = {
      type: pType as "M" | "A",
      modelName: rawModel,
      data: [],
      ...(recIdStr ? { recordId: recIdStr } : {}),
      ...(arrFieldStr ? { arrayField: arrFieldStr } : {}),
      ...(dispStr ? { displayField: dispStr } : {}),
      ...(condStr ? { condition: condStr } : {}),
      ...(codeStr ? { codeField: codeStr } : {}),
    };
  } else if ((pType === "O" || !pType) && Array.isArray(p?.data)) {
    const rawArr = p.data;
    if (rawArr.length > 0) {
      sanitized.PARAMETER = {
        type: "O",
        data: rawArr.map((opt) => ({
          code: String(opt.code ?? ""),
          label: String(opt.label ?? opt.code ?? ""),
        })),
      };
    }
  }

  if (cleanField.NUMBER_CONFIG) sanitized.NUMBER_CONFIG = cleanField.NUMBER_CONFIG;
  if (cleanField.RATE_CONFIG) sanitized.RATE_CONFIG = cleanField.RATE_CONFIG;
  if (cleanField.DATE_CONFIG) sanitized.DATE_CONFIG = cleanField.DATE_CONFIG;
  if (cleanField.BOOLEAN_CONFIG) sanitized.BOOLEAN_CONFIG = cleanField.BOOLEAN_CONFIG;

  if (cleanField.VISIBLE_WHEN) sanitized.VISIBLE_WHEN = cleanField.VISIBLE_WHEN;
  if (cleanField.DISABLED_WHEN) sanitized.DISABLED_WHEN = cleanField.DISABLED_WHEN;
  if (cleanField.TRANSFORM) sanitized.TRANSFORM = cleanField.TRANSFORM;
  if (Array.isArray(cleanField.CASCADE) && cleanField.CASCADE.length > 0) {
    sanitized.CASCADE = cleanField.CASCADE;
  }

  if (Array.isArray(cleanField.PROP) && cleanField.PROP.length > 0) {
    sanitized.PROP = cleanField.PROP.map(sanitizeFormElement);
  }

  return sanitized as FormElement;
}

/**
 * Sanitizes a FormSection for sparse database persistence:
 * - Omits empty titles, descriptions, groupIds
 * - Omits default false flags (collapsible: false, isCollapsed: false)
 * - Sanitizes all inner child fields
 */
function sanitizeFormSection(section: FormSection): FormSection {
  const sanitized: Partial<FormSection> = {
    id: section.id,
    containerType: section.containerType || "card",
    columns: section.columns || 1,
  };

  for (const key of SECTION_STRINGS) {
    if (section[key]?.trim()) sanitized[key] = section[key].trim();
  }
  if (section.collapsible) sanitized.collapsible = true;
  if (section.isCollapsed) sanitized.isCollapsed = true;
  if (section.containerConfig) sanitized.containerConfig = section.containerConfig;

  sanitized.fields = (section.fields || []).map(sanitizeFormElement);
  return sanitized as FormSection;
}

/**
 * Moves each tab group's tabs up to its first tab, so the stored order is the rendered order
 * (`buildRenderBlocks` groups tabs by `groupId`, untitled-group tabs together).
 */
function groupTabsTogether(sections: FormSection[]): FormSection[] {
  const groups = new Map<string, FormSection[]>();
  const ordered: (FormSection | FormSection[])[] = [];
  for (const section of sections) {
    if (section.containerType !== "tab") {
      ordered.push(section);
      continue;
    }
    const key = section.groupId?.trim() ?? "";
    const group = groups.get(key);
    if (group) {
      group.push(section);
    } else {
      const created = [section];
      groups.set(key, created);
      ordered.push(created);
    }
  }
  return ordered.flat();
}

/**
 * Produces a clean, sparse FormConfigRecord ready for database wire persistence.
 */
export function sanitizeFormConfigRecord(record: FormConfigRecord): FormConfigRecord {
  const result: Partial<FormConfigRecord> = {};

  if (record.title?.trim()) result.title = record.title.trim();
  if (record.description?.trim()) result.description = record.description.trim();
  if (record.authNumber !== undefined && record.authNumber !== null) {
    result.authNumber = record.authNumber;
  }
  if (record.auditData) result.auditData = record.auditData;

  if (record.frmRoutine) {
    const rtnValidate = (record.frmRoutine.rtnValidate || []).filter((r) => r.routineName?.trim());
    const rtnBeforeAuth = (record.frmRoutine.rtnBeforeAuth || []).filter((r) =>
      r.routineName?.trim(),
    );
    const rtnAfterAuth = (record.frmRoutine.rtnAfterAuth || []).filter((r) =>
      r.routineName?.trim(),
    );

    if (rtnValidate.length > 0 || rtnBeforeAuth.length > 0 || rtnAfterAuth.length > 0) {
      result.frmRoutine = { rtnValidate, rtnBeforeAuth, rtnAfterAuth };
    }
  }

  if (record.frmElements?.sections) {
    result.frmElements = {
      ...(record.frmElements.layout ? { layout: record.frmElements.layout } : {}),
      ...(record.frmElements.density ? { density: record.frmElements.density } : {}),
      sections: groupTabsTogether(record.frmElements.sections).map(sanitizeFormSection),
    };
  }

  return result as FormConfigRecord;
}
