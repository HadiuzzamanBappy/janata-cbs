import { z } from "zod";
import {
  type FormConfigRecord,
  type FormSection,
  formConfigRecordSchema,
  gfcResponseSchema,
} from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
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
 * Pure parser for combined GFC / GNI responses from CBS Core backend.
 * Unwraps the combined envelope into typed ModelConfigRecord and FormConfigRecord.
 */
export function parseGfcResponse(
  rawPayload: unknown,
): { success: true; data: ParsedGfcResponse } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "GFC payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload(decoded);
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

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

  const combined = parsed.data;
  const rawFc = combined.FORMCONTROL as Record<string, unknown> | undefined;

  const hasExistingLayout = Boolean(
    rawFc && Object.keys(rawFc).length > 0 && (rawFc.frmElements || rawFc.title || rawFc.sections),
  );

  let form: FormConfigRecord | null = null;
  if (hasExistingLayout && rawFc) {
    const formParsed = formConfigRecordSchema.safeParse(rawFc);
    if (formParsed.success) {
      form = formParsed.data;
    } else {
      console.warn(
        "[parseGfcResponse] Failed to parse FORMCONTROL layout against schema:",
        formParsed.error.issues,
      );
    }
  }

  const model: ModelConfigRecord = {
    _DEVBY: combined._DEVBY || "",
    _DEVDATE: combined._DEVDATE || "",
    DESCRIPTION: combined.DESCRIPTION || combined.TABLENAME,
    PREFIX: combined.PREFIX || "",
    TABLENAME: combined.TABLENAME,
    USERDEFINEID: combined.USERDEFINEID,
    ACCESS: combined.ACCESS,
    READONLY: combined.READONLY,
    SEARCHABLE: combined.SEARCHABLE,
    ASSOCIATES: combined.ASSOCIATES,
    AUTHORIZE: combined.AUTHORIZE,
    SERVICEPATH: combined.SERVICEPATH,
    IDDEF: combined.IDDEF,
    PROPERTIES: combined.PROPERTIES,
    IDROUTINE: combined.IDROUTINE || "",
    FIELDBASED: combined.FIELDBASED,
    auditData: combined.auditData,
  };

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
/* Single Record Parser (for FormConfigRecord directly)                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound JSON / Protobuf payload into a strictly validated FormConfigRecord.
 */
export function parseFormConfig(
  rawPayload: unknown,
): { success: true; data: FormConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Form config payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload(decoded);
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  if (!target || typeof target !== "object") {
    return { success: false, error: "Form config record is empty or invalid" };
  }

  const targetRec = target as Record<string, unknown>;

  // Case 1: Combined GFC response with FORMCONTROL
  if (
    "FORMCONTROL" in targetRec &&
    targetRec.FORMCONTROL &&
    typeof targetRec.FORMCONTROL === "object"
  ) {
    const fc = targetRec.FORMCONTROL as Record<string, unknown>;
    const hasExistingLayout = Boolean(
      Object.keys(fc).length > 0 && (fc.frmElements || fc.title || fc.sections),
    );
    if (hasExistingLayout) {
      const fcParseResult = formConfigRecordSchema.safeParse(fc);
      if (fcParseResult.success) {
        return {
          success: true,
          data: fcParseResult.data,
        };
      }
    }
  }

  // Case 2: Standalone FormConfigRecord
  const parseResult = formConfigRecordSchema.safeParse(target);
  if (!parseResult.success) {
    return {
      success: false,
      error: `FormConfig validation failed: ${parseResult.error.message}`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* List Parser                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Parses a list of form config records from CBS backend wire responses.
 */
export function parseFormConfigList(
  rawPayload: unknown,
): { success: true; data: FormConfigRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawList = unwrapRecordsPayload(rawPayload);
  const parseResult = z.array(formConfigRecordSchema).safeParse(rawList);

  if (!parseResult.success) {
    return {
      success: false,
      error: `Form config list validation failed: ${parseResult.error.message}`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* Sanitizers & Wire Serializers                                              */
/* -------------------------------------------------------------------------- */

/**
 * Sanitizes a FormElement for database persistence and wire JSON output:
 * - Removes client-only identifiers (`id: "f_..."`)
 * - Omits default falsy flags (`REQUIRED: false`, `DISABLED: false`)
 * - Omits empty text overrides (`DEFAULTVALUE: ""`, `ENRICHTEXT: ""`, `POSITION: ""`, `HELPTEXT: ""`, `FIXEDVALUE: ""`, `VALUE: ""`)
 * - Omits empty/default PARAMETER blocks if no options or model table are configured
 * - Omits type configuration blocks that are empty or inapplicable
 */
export function sanitizeFormElement(field: FormElement): FormElement {
  const { id: _clientId, ...cleanField } = field as FormElement & { id?: string };

  const sanitized: Partial<FormElement> = {
    SN: String(cleanField.SN || "1"),
    NAME: cleanField.NAME,
    LABEL: cleanField.LABEL || cleanField.NAME,
    TYPE: cleanField.TYPE || "Text",
    STRUCTURE: cleanField.STRUCTURE || "S",
    LENGTH: cleanField.LENGTH ?? 35,
  };

  // Only keep presentation overrides if non-default
  if (cleanField.REQUIRED) sanitized.REQUIRED = true;
  if (cleanField.DISABLED) sanitized.DISABLED = true;
  if (cleanField.WIDTH && cleanField.WIDTH !== 280) sanitized.WIDTH = cleanField.WIDTH;
  if (cleanField.POSITION?.trim()) sanitized.POSITION = cleanField.POSITION.trim();
  if (cleanField.ENRICHTEXT?.trim()) sanitized.ENRICHTEXT = cleanField.ENRICHTEXT.trim();
  if (
    cleanField.DEFAULTVALUE !== undefined &&
    cleanField.DEFAULTVALUE !== null &&
    String(cleanField.DEFAULTVALUE).trim() !== ""
  ) {
    sanitized.DEFAULTVALUE = String(cleanField.DEFAULTVALUE).trim();
  }
  if (cleanField.HELPTEXT?.trim()) sanitized.HELPTEXT = cleanField.HELPTEXT.trim();
  if (cleanField.FIXEDVALUE?.trim()) sanitized.FIXEDVALUE = cleanField.FIXEDVALUE.trim();

  // Widget
  if (cleanField.WIDGET) sanitized.WIDGET = cleanField.WIDGET;

  // Reactive ON_CHANGE rule
  if (cleanField.ON_CHANGE?.target?.trim()) {
    sanitized.ON_CHANGE = {
      target: cleanField.ON_CHANGE.target.trim(),
      action: cleanField.ON_CHANGE.action || "copy",
      ...(cleanField.ON_CHANGE.delimiter ? { delimiter: cleanField.ON_CHANGE.delimiter } : {}),
    };
  }

  // Cross-field VALIDATION rule
  if (cleanField.VALIDATION?.matches?.trim()) {
    sanitized.VALIDATION = {
      matches: cleanField.VALIDATION.matches.trim(),
      ...(cleanField.VALIDATION.message ? { message: cleanField.VALIDATION.message.trim() } : {}),
    };
  }

  // Parameter / Lookup
  const p = cleanField.PARAMETER;
  if (p) {
    if (p.type === "M" && p.modelName?.trim()) {
      const paramM: Record<string, unknown> = {
        type: "M",
        modelName: p.modelName.trim(),
      };
      if (p.reference?.trim()) paramM.reference = p.reference.trim();
      if (p.displayField?.trim()) paramM.displayField = p.displayField.trim();
      if (p.condition?.trim()) paramM.condition = p.condition.trim();
      if (p.codeField?.trim()) paramM.codeField = p.codeField.trim();
      sanitized.PARAMETER = paramM as typeof cleanField.PARAMETER;
    } else if ((p.type === "O" || !p.type) && Array.isArray(p.data) && p.data.length > 0) {
      sanitized.PARAMETER = {
        type: "O",
        data: p.data,
      } as typeof cleanField.PARAMETER;
    }
  }

  // Type configuration blocks (only if configured)
  if (
    cleanField.TEXT_CONFIG &&
    (cleanField.TEXT_CONFIG.maskPattern ||
      cleanField.TEXT_CONFIG.textTransform !== "uppercase" ||
      !cleanField.TEXT_CONFIG.autoTrim)
  ) {
    sanitized.TEXT_CONFIG = cleanField.TEXT_CONFIG;
  }
  if (
    cleanField.NUMBER_CONFIG &&
    (cleanField.NUMBER_CONFIG.isCurrency ||
      cleanField.NUMBER_CONFIG.currencyCode ||
      cleanField.NUMBER_CONFIG.decimals !== 2 ||
      cleanField.NUMBER_CONFIG.allowNegative)
  ) {
    sanitized.NUMBER_CONFIG = cleanField.NUMBER_CONFIG;
  }
  if (
    cleanField.DATE_CONFIG &&
    (cleanField.DATE_CONFIG.datePattern !== "YYYY-MM-DD" ||
      cleanField.DATE_CONFIG.minDateOffset ||
      cleanField.DATE_CONFIG.maxDateOffset ||
      cleanField.DATE_CONFIG.disableHolidays)
  ) {
    sanitized.DATE_CONFIG = cleanField.DATE_CONFIG;
  }
  if (
    cleanField.BOOLEAN_CONFIG &&
    (cleanField.BOOLEAN_CONFIG.widgetStyle !== "switch" ||
      cleanField.BOOLEAN_CONFIG.trueValue !== "Y" ||
      cleanField.BOOLEAN_CONFIG.falseValue !== "N")
  ) {
    sanitized.BOOLEAN_CONFIG = cleanField.BOOLEAN_CONFIG;
  }

  return sanitized as FormElement;
}

/**
 * Sanitizes a FormSection for sparse database persistence:
 * - Omits empty titles, descriptions, tabGroupIds
 * - Omits default false flags (collapsible: false, isCollapsed: false)
 * - Sanitizes all inner child fields
 */
export function sanitizeFormSection(section: FormSection): FormSection {
  const sanitized: Partial<FormSection> = {
    id: section.id,
    type: section.type || "standard",
    zone: section.zone || "standard",
    columns: section.columns || 1,
    layoutStyle: section.layoutStyle || "card",
  };

  if (section.title?.trim()) sanitized.title = section.title.trim();
  if (section.description?.trim()) sanitized.description = section.description.trim();
  if (section.tabGroupId?.trim()) sanitized.tabGroupId = section.tabGroupId.trim();
  if (section.tabTitle?.trim()) sanitized.tabTitle = section.tabTitle.trim();
  if (section.bindKey?.trim()) sanitized.bindKey = section.bindKey.trim();
  if (section.structure) sanitized.structure = section.structure;
  if (section.collapsible) sanitized.collapsible = true;
  if (section.isCollapsed) sanitized.isCollapsed = true;

  sanitized.fields = (section.fields || []).map(sanitizeFormElement);

  return sanitized as FormSection;
}

/**
 * Produces a clean, sparse FormConfigRecord ready for database wire persistence and JSON audit diffing.
 */
export function sanitizeFormConfigRecord(record?: FormConfigRecord): FormConfigRecord | undefined {
  if (!record) return undefined;

  const result: Partial<FormConfigRecord> = {};

  if (record.title?.trim()) result.title = record.title.trim();
  if (record.description?.trim()) result.description = record.description.trim();
  if (record.authNumber !== undefined && record.authNumber !== null)
    result.authNumber = record.authNumber;
  if (record.targetModel) result.targetModel = record.targetModel;
  if (record.auditData) result.auditData = record.auditData;

  // Routines: only keep if routines actually exist
  if (record.frmRoutine) {
    const rtnValidate = (record.frmRoutine.rtnValidate || []).filter((r) => r.routineName?.trim());
    const rtnBeforeAuth = (record.frmRoutine.rtnBeforeAuth || []).filter((r) =>
      r.routineName?.trim(),
    );
    const rtnAfterAuth = (record.frmRoutine.rtnAfterAuth || []).filter((r) =>
      r.routineName?.trim(),
    );

    if (rtnValidate.length > 0 || rtnBeforeAuth.length > 0 || rtnAfterAuth.length > 0) {
      result.frmRoutine = {
        rtnValidate,
        rtnBeforeAuth,
        rtnAfterAuth,
      };
    }
  }

  // Layout Elements
  if (record.frmElements) {
    const steps = (record.frmElements.steps || []).filter((s) => s.id && s.title);
    const sections = (record.frmElements.sections || []).map(sanitizeFormSection);

    result.frmElements = {
      ...(steps.length > 0 ? { steps } : { steps: [] }),
      sections,
    };
  }

  return result as FormConfigRecord;
}
