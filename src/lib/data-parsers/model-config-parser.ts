import {
  type ModelConfigRecord,
  type ModelProperty,
  modelConfigRecordSchema,
  PROPERTY_TYPES,
} from "@/lib/data-schemas";
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

const VALID_PROPERTY_TYPES = new Set<string>(PROPERTY_TYPES);

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
 * Normalizes and extracts the inner model config record from arbitrary CBS response envelopes.
 */
export function extractModelConfigRecord(rawPayload: unknown): Record<string, unknown> | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  if (!decoded || typeof decoded !== "object") return null;

  let target: Record<string, unknown> =
    unwrapRecordsPayload(decoded)[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);
  if (!target || typeof target !== "object") return null;

  if (target.data && typeof target.data === "object" && !Array.isArray(target.data)) {
    target = target.data as Record<string, unknown>;
  }
  if (target.record && typeof target.record === "object" && !Array.isArray(target.record)) {
    target = target.record as Record<string, unknown>;
  }
  if (!target.auditData && target.auditFields && typeof target.auditFields === "object") {
    target = { ...target, auditData: target.auditFields };
  }
  return target;
}

/**
 * Parses inbound wire payload into a strictly validated, sanitized ModelConfigRecord.
 */
export function parseModelConfig(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord } | { success: false; error: string } {
  const target = extractModelConfigRecord(rawPayload);
  if (!target) return { success: false, error: "Model config payload is invalid" };

  const parsed = modelConfigRecordSchema.safeParse(target);
  if (!parsed.success) {
    return { success: false, error: `ModelConfig validation failed: ${parsed.error.message}` };
  }

  const sanitizedProps = (parsed.data.PROPERTIES || []).map((p, i) => sanitizeModelProperty(p, i));

  return {
    success: true,
    data: {
      ...parsed.data,
      ACCESS: parsed.data.ACCESS.toUpperCase().startsWith("B") ? "B" : "G",
      PROPERTIES: sanitizedProps,
      USERDEFINEID: Boolean(parsed.data.USERDEFINEID),
      READONLY: Boolean(parsed.data.READONLY),
      SEARCHABLE: Boolean(parsed.data.SEARCHABLE),
      AUTHORIZE: Boolean(parsed.data.AUTHORIZE),
      FIELDBASED: Boolean(parsed.data.FIELDBASED),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Outbound Database Serializers & Physical Column Sanitizers                 */
/* -------------------------------------------------------------------------- */

/**
 * Sanitizes a ModelProperty for MODEL.CONFIG: enforces physical invariants and purges UI noise.
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

  const sanitized: ModelProperty = {
    SN: String(prop.SN || (index !== undefined ? index + 1 : "")).trim(),
    NAME: String(prop.NAME || "").trim(),
    LABEL: String(prop.LABEL || prop.NAME || "").trim(),
    TYPE: normType,
    STRUCTURE: normStructure,
    LENGTH: normLength,
    REQUIRED: Boolean(prop.REQUIRED),
  };

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

      if (cleanData.length > 0) sanitized.PARAMETER = { type: "O", data: cleanData };
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

  if (normType === "Object" && Array.isArray(prop.PROP) && prop.PROP.length > 0) {
    sanitized.PROP = prop.PROP.map((sub, sIdx) => sanitizeModelProperty(sub, sIdx));
  }

  return sanitized;
}

/**
 * Sanitizes a ModelConfigRecord for sparse persistence.
 */
export function sanitizeModelConfigRecord(
  record?: ModelConfigRecord,
): ModelConfigRecord | undefined {
  if (!record) return undefined;

  const rawAccess = String(record.ACCESS || "G")
    .trim()
    .toUpperCase();
  const result: Partial<ModelConfigRecord> = {
    TABLENAME: String(record.TABLENAME || "").trim(),
    DESCRIPTION: String(record.DESCRIPTION || record.TABLENAME || "").trim(),
    ACCESS: rawAccess.startsWith("B") ? "B" : "G",
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

  result.PROPERTIES = (record.PROPERTIES || []).map((p, i) => sanitizeModelProperty(p, i));
  if (record.auditData) result.auditData = record.auditData;

  return result as ModelConfigRecord;
}
