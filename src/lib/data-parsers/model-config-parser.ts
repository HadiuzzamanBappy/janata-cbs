import { z } from "zod";
import {
  type ModelConfigRecord,
  type ModelProperty,
  modelConfigRecordSchema,
} from "@/lib/data-schemas/model-config-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Single Record Parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound JSON payload into a strictly validated ModelConfigRecord.
 */
export function parseModelConfig(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Model config payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload(decoded);
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  const parseResult = modelConfigRecordSchema.safeParse(target);
  if (!parseResult.success) {
    return {
      success: false,
      error: `ModelConfig validation failed: ${parseResult.error.message}`,
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
 * Parses a list of model config records from CBS backend wire responses.
 */
export function parseModelConfigList(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawList = unwrapRecordsPayload(rawPayload);
  const parseResult = z.array(modelConfigRecordSchema).safeParse(rawList);

  if (!parseResult.success) {
    return {
      success: false,
      error: `Model config list validation failed: ${parseResult.error.message}`,
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
 * Sanitizes a ModelProperty in MODEL.CONFIG:
 * - Recursively preserves nested sub-properties (PROP) for Object types
 * - Preserves lookup parameters (PARAMETER) for Dropdown types
 * - Omits default false flags (REQUIRED: false)
 * - Omits default WIDTH (280)
 */
export function sanitizeModelProperty(prop: ModelProperty): ModelProperty {
  const sanitized: Partial<ModelProperty> = {
    SN: String(prop.SN || ""),
    NAME: prop.NAME,
    LABEL: prop.LABEL || prop.NAME,
    TYPE: prop.TYPE || "Text",
    STRUCTURE: prop.STRUCTURE || "S",
    LENGTH: prop.LENGTH ?? 50,
  };

  if (prop.REQUIRED) sanitized.REQUIRED = true;
  if (prop.WIDTH && prop.WIDTH !== 280) sanitized.WIDTH = prop.WIDTH;

  // Dropdown parameters (options list or model reference)
  if (prop.PARAMETER && (prop.PARAMETER.data?.length || prop.PARAMETER.modelName)) {
    sanitized.PARAMETER = prop.PARAMETER;
  }

  // Nested Object sub-properties (PROP)
  if (prop.TYPE === "Object" && Array.isArray(prop.PROP) && prop.PROP.length > 0) {
    sanitized.PROP = prop.PROP.map(sanitizeModelProperty);
  }

  return sanitized as ModelProperty;
}

/**
 * Sanitizes a ModelConfigRecord for sparse persistence:
 * - Cleans properties array
 * - Omits empty IDDEF properties
 * - Omits empty IDROUTINE, _DEVBY, _DEVDATE if unset
 */
export function sanitizeModelConfigRecord(
  record?: ModelConfigRecord,
): ModelConfigRecord | undefined {
  if (!record) return undefined;

  const result: Partial<ModelConfigRecord> = {
    TABLENAME: record.TABLENAME,
    DESCRIPTION: record.DESCRIPTION,
    ACCESS: record.ACCESS,
    SERVICEPATH: record.SERVICEPATH,
  };

  if (record.PREFIX?.trim()) result.PREFIX = record.PREFIX.trim();
  if (record.USERDEFINEID) result.USERDEFINEID = true;
  if (record.READONLY) result.READONLY = true;
  if (record.SEARCHABLE) result.SEARCHABLE = true;
  if (record.AUTHORIZE) result.AUTHORIZE = true;
  if (record.FIELDBASED) result.FIELDBASED = true;

  if (record.ASSOCIATES && record.ASSOCIATES.length > 0) {
    result.ASSOCIATES = record.ASSOCIATES;
  }

  if (record._DEVBY?.trim()) result._DEVBY = record._DEVBY.trim();
  if (record._DEVDATE?.trim()) result._DEVDATE = record._DEVDATE.trim();
  if (record.IDROUTINE?.trim()) result.IDROUTINE = record.IDROUTINE.trim();

  // IDDEF
  if (record.IDDEF) {
    const { IDPREFIX, SEQUENCELENGTH, SEQUENCERESET, IDPATTERN } = record.IDDEF;
    if (IDPREFIX?.trim() || SEQUENCELENGTH || SEQUENCERESET || IDPATTERN?.trim()) {
      result.IDDEF = {
        IDPREFIX: IDPREFIX || "",
        SEQUENCELENGTH: SEQUENCELENGTH || "",
        SEQUENCERESET: Boolean(SEQUENCERESET),
        IDPATTERN: IDPATTERN || "",
      };
    }
  }

  // PROPERTIES
  result.PROPERTIES = (record.PROPERTIES || []).map(sanitizeModelProperty);

  if (record.auditData) result.auditData = record.auditData;

  return result as ModelConfigRecord;
}
