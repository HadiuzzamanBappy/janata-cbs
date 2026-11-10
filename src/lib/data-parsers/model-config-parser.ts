import {
  type ModelConfigRecord,
  type ModelProperty,
  modelConfigRecordSchema,
} from "@/lib/data-schemas/model-config-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Constants & Type Mappings                                                  */
/* -------------------------------------------------------------------------- */

const FIXED_TYPE_LENGTHS: Readonly<Record<string, number>> = {
  Date: 10,
  DateTime: 19,
  Boolean: 1,
  Object: 0,
};

const VALID_PROPERTY_TYPES: ReadonlySet<string> = new Set([
  "Text",
  "Number",
  "Amount",
  "Rate",
  "Date",
  "DateTime",
  "Boolean",
  "Object",
]);

const BOOLEAN_FLAGS = [
  "USERDEFINEID",
  "READONLY",
  "SEARCHABLE",
  "AUTHORIZE",
  "FIELDBASED",
] as const;

/* -------------------------------------------------------------------------- */
/* Inbound Wire Response Parser                                               */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound wire payload into a strictly validated, sanitized ModelConfigRecord.
 */
export function parseModelConfig(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Model config payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const target =
    unwrapRecordsPayload(decoded)[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  const parsed = modelConfigRecordSchema.safeParse(target);
  if (!parsed.success) {
    return {
      success: false,
      error: `ModelConfig validation failed: ${parsed.error.message}`,
    };
  }

  return {
    success: true,
    data: sanitizeModelConfigRecord(parsed.data) ?? parsed.data,
  };
}

/* -------------------------------------------------------------------------- */
/* Outbound Database Serializers & Physical Column Sanitizers                 */
/* -------------------------------------------------------------------------- */

/**
 * Sanitizes a ModelProperty for MODEL.CONFIG:
 * - Enforces database column invariants based on TYPE (Date: 10, DateTime: 19, Boolean: 1/S, Object: 0)
 * - Purges presentation layer attributes (WIDTH, WIDGET, DISABLED, POSITION, DEFAULTVALUE, etc.)
 * - Normalizes parameter lookups (Options List 'O' vs Model Lookup 'M')
 */
export function sanitizeModelProperty(prop: ModelProperty, index?: number): ModelProperty {
  const normType = (
    VALID_PROPERTY_TYPES.has(prop.TYPE) ? prop.TYPE : "Text"
  ) as ModelProperty["TYPE"];
  const normStructure = normType === "Boolean" ? "S" : prop.STRUCTURE === "M" ? "M" : "S";

  let normLength = FIXED_TYPE_LENGTHS[normType];
  if (normLength === undefined) {
    const rawLen = typeof prop.LENGTH === "string" ? Number.parseInt(prop.LENGTH, 10) : prop.LENGTH;
    normLength = typeof rawLen === "number" && !Number.isNaN(rawLen) && rawLen > 0 ? rawLen : 50;
  }

  const sanitized: Partial<ModelProperty> = {
    SN: String(prop.SN || (index !== undefined ? index + 1 : "")).trim(),
    NAME: String(prop.NAME || "").trim(),
    LABEL: String(prop.LABEL || prop.NAME || "").trim(),
    TYPE: normType,
    STRUCTURE: normStructure,
    LENGTH: normLength,
  };

  if (prop.REQUIRED) sanitized.REQUIRED = true;

  // Lookup parameters: ONLY applicable to Text
  if (normType === "Text" && prop.PARAMETER) {
    const { type, data, modelName, codeField, displayField, condition } = prop.PARAMETER;
    if (type === "O") {
      const cleanData = (Array.isArray(data) ? data : [])
        .map((item) => {
          const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const code = String(rec.itemCode ?? rec.code ?? item ?? "").trim();
          const label = String(rec.itemLabel ?? rec.label ?? code).trim();
          return code || label ? { itemCode: code || label, itemLabel: label || code } : null;
        })
        .filter((item): item is { itemCode: string; itemLabel: string } => item !== null);

      if (cleanData.length > 0) {
        sanitized.PARAMETER = { type: "O", data: cleanData };
      }
    } else if (type === "M" && modelName?.trim()) {
      sanitized.PARAMETER = {
        type: "M",
        modelName: modelName.trim(),
        codeField: String(codeField || "").trim(),
        displayField: String(displayField || "").trim(),
        ...(condition?.trim() ? { condition: condition.trim() } : {}),
      };
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
 * - Enforces physical column invariants on PROPERTIES and strips UI presentation fields
 * - Omits empty IDDEF, ASSOCIATES, and falsy boolean flags for sparse wire payloads
 */
export function sanitizeModelConfigRecord(
  record?: ModelConfigRecord,
): ModelConfigRecord | undefined {
  if (!record) return undefined;

  const rawAccess = String(record.ACCESS || "G")
    .trim()
    .toUpperCase();
  const normAccess = rawAccess.startsWith("B") ? "B" : "G";

  const result: Partial<ModelConfigRecord> = {
    TABLENAME: String(record.TABLENAME || "").trim(),
    DESCRIPTION: String(record.DESCRIPTION || record.TABLENAME || "").trim(),
    ACCESS: normAccess,
    SERVICEPATH: String(record.SERVICEPATH || "/api/v1/data").trim(),
  };

  if (record.PREFIX?.trim()) result.PREFIX = record.PREFIX.trim();
  for (const flag of BOOLEAN_FLAGS) {
    if (record[flag]) result[flag] = true;
  }

  if (Array.isArray(record.ASSOCIATES) && record.ASSOCIATES.length > 0) {
    const cleanAssoc = record.ASSOCIATES.map((a) => String(a || "").trim()).filter(Boolean);
    if (cleanAssoc.length > 0) result.ASSOCIATES = cleanAssoc;
  }

  if (record._DEVBY?.trim()) result._DEVBY = record._DEVBY.trim();
  if (record._DEVDATE?.trim()) result._DEVDATE = record._DEVDATE.trim();
  if (record.IDROUTINE?.trim()) result.IDROUTINE = record.IDROUTINE.trim();

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

  result.PROPERTIES = (record.PROPERTIES || []).map((prop, idx) =>
    sanitizeModelProperty(prop, idx),
  );

  if (record.auditData) result.auditData = record.auditData;

  return result as ModelConfigRecord;
}
