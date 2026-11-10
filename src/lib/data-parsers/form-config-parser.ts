import {
  type FormConfigRecord,
  type FormSection,
  formConfigRecordSchema,
  gfcResponseSchema,
} from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { sanitizeModelConfigRecord } from "./model-config-parser";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Combined GFC Response Parser                                                */
/* -------------------------------------------------------------------------- */

export interface ParsedGfcResponse {
  model: ModelConfigRecord;
  form: FormConfigRecord | null;
  isNew: boolean;
}

/**
 * Parses combined GFC wire response containing physical ModelConfigRecord
 * and presentation FORMCONTROL layout into clean, normalized domain structures.
 */
export function parseGfcResponse(
  rawPayload: unknown,
): { success: true; data: ParsedGfcResponse } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "GFC payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const target =
    unwrapRecordsPayload(decoded)[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  if (!target || typeof target !== "object") {
    return { success: false, error: "GFC payload record is empty or invalid" };
  }

  const parsed = gfcResponseSchema.safeParse(target);
  if (!parsed.success) {
    return {
      success: false,
      error: `GFC response validation failed: ${parsed.error.message}`,
    };
  }

  const { FORMCONTROL, ...modelRaw } = parsed.data;
  const rawFc = FORMCONTROL as Record<string, unknown> | undefined;

  const hasExistingLayout = Boolean(
    rawFc && Object.keys(rawFc).length > 0 && (rawFc.frmElements || rawFc.title || rawFc.sections),
  );

  let form: FormConfigRecord | null = null;
  if (hasExistingLayout && rawFc) {
    const formParsed = formConfigRecordSchema.safeParse(rawFc);
    if (formParsed.success) {
      form = sanitizeFormConfigRecord(formParsed.data) ?? formParsed.data;
    }
  }

  const model =
    sanitizeModelConfigRecord(modelRaw as ModelConfigRecord) ?? (modelRaw as ModelConfigRecord);

  return {
    success: true,
    data: {
      model,
      form,
      isNew: form === null,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Outbound Database Serializers & Physical Form Sanitizers                   */
/* -------------------------------------------------------------------------- */

const TEXT_OVERRIDES = ["POSITION", "ENRICHTEXT", "FIXEDVALUE", "DEFAULTVALUE"] as const;
const SECTION_STRINGS = ["title", "description", "groupId", "groupTitle"] as const;

/**
 * Sanitizes a FormElement for database persistence and wire JSON output:
 * - Removes client-only identifiers (`id: "f_..."`)
 * - Omits default falsy flags (`REQUIRED: false`, `DISABLED: false`)
 * - Omits empty text overrides and compresses sparse JSON
 */
export function sanitizeFormElement(field: FormElement): FormElement {
  const { id: _clientId, ...cleanField } = field as FormElement & { id?: string };

  const rawLength =
    typeof cleanField.LENGTH === "string"
      ? Number.parseInt(cleanField.LENGTH, 10)
      : cleanField.LENGTH;
  const normLength =
    typeof rawLength === "number" && !Number.isNaN(rawLength) && rawLength > 0 ? rawLength : 35;

  const sanitized: Partial<FormElement> = {
    SN: String(cleanField.SN || "1").trim(),
    NAME: cleanField.NAME.trim(),
    LABEL: (cleanField.LABEL || cleanField.NAME).trim(),
    TYPE: cleanField.TYPE || "Text",
    STRUCTURE: cleanField.STRUCTURE || "S",
    LENGTH: normLength,
  };

  if (cleanField.REQUIRED) sanitized.REQUIRED = true;
  if (cleanField.DISABLED) sanitized.DISABLED = true;
  if (cleanField.WIDTH && cleanField.WIDTH !== "md") sanitized.WIDTH = cleanField.WIDTH;
  if (cleanField.WIDGET) sanitized.WIDGET = cleanField.WIDGET;

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

  if (cleanField.VALIDATION?.matches?.trim()) {
    sanitized.VALIDATION = {
      matches: cleanField.VALIDATION.matches.trim(),
      ...(cleanField.VALIDATION.message?.trim()
        ? { message: cleanField.VALIDATION.message.trim() }
        : {}),
    };
  }

  const p = cleanField.PARAMETER;
  if (p?.type === "M" && p.modelName?.trim()) {
    sanitized.PARAMETER = {
      type: "M",
      modelName: p.modelName.trim(),
      ...(p.reference?.trim() ? { reference: p.reference.trim() } : {}),
      ...(p.displayField?.trim() ? { displayField: p.displayField.trim() } : {}),
      ...(p.condition?.trim() ? { condition: p.condition.trim() } : {}),
      ...(p.codeField?.trim() ? { codeField: p.codeField.trim() } : {}),
    };
  } else if ((p?.type === "O" || !p?.type) && Array.isArray(p?.data) && p.data.length > 0) {
    sanitized.PARAMETER = { type: "O", data: p.data };
  }

  if (cleanField.TEXT_CONFIG) sanitized.TEXT_CONFIG = cleanField.TEXT_CONFIG;
  if (cleanField.NUMBER_CONFIG) sanitized.NUMBER_CONFIG = cleanField.NUMBER_CONFIG;
  if (cleanField.DATE_CONFIG) sanitized.DATE_CONFIG = cleanField.DATE_CONFIG;
  if (cleanField.BOOLEAN_CONFIG) sanitized.BOOLEAN_CONFIG = cleanField.BOOLEAN_CONFIG;

  return sanitized as FormElement;
}

/**
 * Sanitizes a FormSection for sparse database persistence:
 * - Omits empty titles, descriptions, groupIds
 * - Omits default false flags (collapsible: false, isCollapsed: false)
 * - Sanitizes all inner child fields
 */
export function sanitizeFormSection(section: FormSection): FormSection {
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
 * Produces a clean, sparse FormConfigRecord ready for database wire persistence.
 */
export function sanitizeFormConfigRecord(record?: FormConfigRecord): FormConfigRecord | undefined {
  if (!record) return undefined;

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
      sections: record.frmElements.sections.map(sanitizeFormSection),
    };
  }

  return result as FormConfigRecord;
}
