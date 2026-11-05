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

  const sanitized = sanitizeModelConfigRecord(parseResult.data);
  return {
    success: true,
    data: sanitized ?? parseResult.data,
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
    data: parseResult.data.map((r) => sanitizeModelConfigRecord(r) ?? r),
  };
}

/* -------------------------------------------------------------------------- */
/* Sanitizers & Wire Serializers                                              */
/* -------------------------------------------------------------------------- */

/**
 * Sanitizes a ModelProperty in MODEL.CONFIG:
 * - Enforces database column invariants based on TYPE:
 *   - Date: fixed length 10, no PARAMETER, no PROP
 *   - DateTime: fixed length 19, no PARAMETER, no PROP
 *   - Boolean: fixed length 1, STRUCTURE locked to 'S', no PARAMETER, no PROP
 *   - Object: length not applicable (0), no PARAMETER, recursively sanitizes PROP
 *   - Number/Amount/Rate: positive length, no PARAMETER, no PROP
 *   - Text:
 *     - If Options List (type: "O"): keeps only type and normalized data [{ code, label }], purges lookup fields
 *     - If Model Lookup (type: "M"): keeps type, modelName, codeField, displayField, condition, purges data array
 * - Purges presentation layer attributes (WIDTH, DISABLED, POSITION, DEFAULTVALUE, FIXEDVALUE, WIDGET, ON_CHANGE, VALIDATION)
 * - Omits default false flags (REQUIRED: false)
 */
export function sanitizeModelProperty(prop: ModelProperty, index?: number): ModelProperty {
  const snStr = String(prop.SN || (index !== undefined ? index + 1 : "")).trim();
  const rawType = prop.TYPE || "Text";
  const normType = (
    ["Text", "Number", "Amount", "Rate", "Date", "DateTime", "Boolean", "Object"].includes(rawType)
      ? rawType
      : "Text"
  ) as ModelProperty["TYPE"];

  const rawStructure = prop.STRUCTURE || "S";
  const normStructure = normType === "Boolean" ? "S" : rawStructure === "M" ? "M" : "S";

  let normLength: number;
  if (normType === "Date") {
    normLength = 10;
  } else if (normType === "DateTime") {
    normLength = 19;
  } else if (normType === "Boolean") {
    normLength = 1;
  } else if (normType === "Object") {
    normLength = 0;
  } else {
    normLength = typeof prop.LENGTH === "number" && prop.LENGTH > 0 ? prop.LENGTH : 50;
  }

  const sanitized: Partial<ModelProperty> = {
    SN: snStr,
    NAME: String(prop.NAME || "").trim(),
    LABEL: String(prop.LABEL || prop.NAME || "").trim(),
    TYPE: normType,
    STRUCTURE: normStructure,
    LENGTH: normLength,
  };

  if (prop.REQUIRED) sanitized.REQUIRED = true;

  // Lookup parameters: ONLY applicable to Text
  if (normType === "Text" && prop.PARAMETER) {
    const pType = prop.PARAMETER.type === "M" ? "M" : "O";
    if (pType === "O") {
      const rawData = Array.isArray(prop.PARAMETER.data) ? prop.PARAMETER.data : [];
      const cleanData = rawData
        .map((item: unknown) => {
          if (typeof item === "object" && item !== null) {
            const rec = item as Record<string, unknown>;
            const code = String(rec.code ?? rec.value ?? rec.name ?? rec.itemCode ?? "").trim();
            const label = String(
              rec.label ?? rec.itemLabel ?? rec.name ?? rec.value ?? code,
            ).trim();
            if (!code && !label) return null;
            return {
              code: code || label,
              label: label || code,
            };
          }
          const str = String(item ?? "").trim();
          if (!str) return null;
          return { code: str, label: str };
        })
        .filter((item): item is { code: string; label: string } => item !== null);

      if (cleanData.length > 0) {
        sanitized.PARAMETER = {
          type: "O",
          data: cleanData,
        };
      }
    } else if (pType === "M") {
      const modelName = String(prop.PARAMETER.modelName || "").trim();
      if (modelName) {
        sanitized.PARAMETER = {
          type: "M",
          modelName,
          codeField: String(prop.PARAMETER.codeField || "").trim(),
          displayField: String(prop.PARAMETER.displayField || "").trim(),
          ...(prop.PARAMETER.condition?.trim()
            ? { condition: prop.PARAMETER.condition.trim() }
            : {}),
        };
      }
    }
  }

  // Nested Object sub-properties: ONLY applicable to Object
  if (normType === "Object" && Array.isArray(prop.PROP) && prop.PROP.length > 0) {
    sanitized.PROP = prop.PROP.map((sub, sIdx) => sanitizeModelProperty(sub, sIdx));
  }

  return sanitized as ModelProperty;
}

/**
 * Sanitizes a ModelConfigRecord for sparse persistence:
 * - Normalizes ACCESS to standard banking codes (Global -> G, Branch -> B)
 * - Cleans properties array and enforces physical type rules
 * - Omits empty IDDEF properties
 * - Omits empty IDROUTINE, _DEVBY, _DEVDATE if unset
 */
export function sanitizeModelConfigRecord(
  record?: ModelConfigRecord,
): ModelConfigRecord | undefined {
  if (!record) return undefined;

  const rawAccess = String(record.ACCESS || "G").trim();
  let normAccess = rawAccess;
  if (rawAccess.toUpperCase().startsWith("G")) normAccess = "G";
  else if (rawAccess.toUpperCase().startsWith("B")) normAccess = "B";

  const result: Partial<ModelConfigRecord> = {
    TABLENAME: String(record.TABLENAME || "").trim(),
    DESCRIPTION: String(record.DESCRIPTION || record.TABLENAME || "").trim(),
    ACCESS: normAccess,
    SERVICEPATH: String(record.SERVICEPATH || "/api/v1/data").trim(),
  };

  if (record.PREFIX?.trim()) result.PREFIX = record.PREFIX.trim();
  if (record.USERDEFINEID) result.USERDEFINEID = true;
  if (record.READONLY) result.READONLY = true;
  if (record.SEARCHABLE) result.SEARCHABLE = true;
  if (record.AUTHORIZE) result.AUTHORIZE = true;
  if (record.FIELDBASED) result.FIELDBASED = true;

  if (Array.isArray(record.ASSOCIATES) && record.ASSOCIATES.length > 0) {
    const cleanAssoc = record.ASSOCIATES.map((a) => String(a || "").trim()).filter(Boolean);
    if (cleanAssoc.length > 0) result.ASSOCIATES = cleanAssoc;
  }

  if (record._DEVBY?.trim()) result._DEVBY = record._DEVBY.trim();
  if (record._DEVDATE?.trim()) result._DEVDATE = record._DEVDATE.trim();
  if (record.IDROUTINE?.trim()) result.IDROUTINE = record.IDROUTINE.trim();

  // IDDEF
  if (record.IDDEF) {
    const { IDPREFIX, SEQUENCELENGTH, SEQUENCERESET, IDPATTERN } = record.IDDEF;
    if (IDPREFIX?.trim() || SEQUENCELENGTH || SEQUENCERESET || IDPATTERN?.trim()) {
      result.IDDEF = {
        IDPREFIX: String(IDPREFIX || "").trim(),
        SEQUENCELENGTH: SEQUENCELENGTH || "",
        SEQUENCERESET: Boolean(SEQUENCERESET),
        IDPATTERN: String(IDPATTERN || "").trim(),
      };
    }
  }

  // PROPERTIES (numbered sequentially, physical invariants enforced, presentation stripped)
  result.PROPERTIES = (record.PROPERTIES || []).map((prop, idx) =>
    sanitizeModelProperty(prop, idx),
  );

  if (record.auditData) result.auditData = record.auditData;

  return result as ModelConfigRecord;
}
