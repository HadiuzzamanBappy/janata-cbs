import { z } from "zod";
import {
  type FormConfigRecord,
  formConfigRecordSchema,
  gfcResponseSchema,
} from "@/lib/data-schemas/form-config-schema";
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
    VIEWDEF: combined.VIEWDEF,
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
