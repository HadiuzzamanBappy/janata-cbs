import {
  CBS_PROPERTY_TYPE,
  DEFAULT_PROPERTY_LENGTH,
  type ModelConfigRecord,
  type ModelProperty,
  PROPERTY_TYPES,
  resolvePhysicalLength,
  resolvePhysicalStructure,
} from "@/lib/data-schemas";
import { unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Constants & Type Mappings                                                  */
/* -------------------------------------------------------------------------- */

const VALID_PROPERTY_TYPES = new Set<string>(PROPERTY_TYPES);

const BOOLEAN_FLAGS = ["USERDEFINEID", "READONLY", "SEARCHABLE"] as const;
const OPTIONAL_STRINGS = ["PREFIX", "_DEVBY", "_DEVDATE"] as const;

/* -------------------------------------------------------------------------- */
/* Inbound Wire Response Parser                                               */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes and extracts the inner model config record from arbitrary CBS response envelopes.
 */
export function extractModelConfigRecord(rawPayload: unknown): Record<string, unknown> | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const payload = rawPayload as Record<string, unknown>;

  let target: Record<string, unknown> =
    unwrapRecordsPayload(payload)[0] ?? (Array.isArray(payload) ? payload[0] : payload);
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

/* -------------------------------------------------------------------------- */
/* Outbound Database Serializers & Physical Column Sanitizers                 */
/* -------------------------------------------------------------------------- */

/**
 * Sanitizes a ModelProperty for MODEL.CONFIG: enforces physical invariants and purges UI noise.
 * `PROP` is a generic column on every property: Array keeps its sanitized sub-properties,
 * every other type writes `[]`.
 */
function sanitizeModelProperty(prop: ModelProperty, index?: number): ModelProperty {
  const rawType = prop.TYPE;
  const normType = (
    VALID_PROPERTY_TYPES.has(rawType) ? rawType : CBS_PROPERTY_TYPE.STRING
  ) as ModelProperty["TYPE"];
  const normStructure = resolvePhysicalStructure(normType, prop.STRUCTURE);
  const normLength = resolvePhysicalLength(normType, prop.LENGTH, DEFAULT_PROPERTY_LENGTH);
  const canLinkModel =
    normType === CBS_PROPERTY_TYPE.STRING || normType === CBS_PROPERTY_TYPE.NUMBER;

  return {
    SN: String(prop.SN || (index !== undefined ? index + 1 : "")).trim(),
    NAME: String(prop.NAME || "").trim(),
    TYPE: normType,
    STRUCTURE: normStructure,
    LENGTH: normLength,
    REQUIRED: Boolean(prop.REQUIRED),
    MODELNAME: canLinkModel
      ? String(prop.MODELNAME || "")
          .trim()
          .toUpperCase()
      : "",
    PROP:
      normType === CBS_PROPERTY_TYPE.ARRAY && Array.isArray(prop.PROP)
        ? prop.PROP.map((sub, sIdx) => sanitizeModelProperty(sub, sIdx))
        : [],
  };
}

/**
 * Sanitizes a ModelConfigRecord for sparse persistence.
 */
export function sanitizeModelConfigRecord(record: Partial<ModelConfigRecord>): ModelConfigRecord {
  const rawAccess = String(record.ACCESS || "G")
    .trim()
    .toUpperCase();
  // The designer passes raw form state, where a cleared Number input is "".
  const rawAuthLevel: unknown = record.AUTHLEVEL;
  const result: Partial<ModelConfigRecord> = {
    TABLENAME: String(record.TABLENAME || "").trim(),
    DESCRIPTION: String(record.DESCRIPTION || record.TABLENAME || "").trim(),
    ACCESS: rawAccess.startsWith("B") ? "B" : "G",
    SERVICEPATH: String(record.SERVICEPATH || "").trim(),
    AUTHLEVEL: rawAuthLevel === "" || rawAuthLevel == null ? 1 : Number(rawAuthLevel),
  };

  for (const key of OPTIONAL_STRINGS) {
    const val = record[key]?.trim();
    if (val) result[key] = val;
  }
  for (const flag of BOOLEAN_FLAGS) {
    if (record[flag]) result[flag] = true;
  }

  if (Array.isArray(record.ASSOCIATES) && record.ASSOCIATES.length > 0) {
    const cleanAssoc = record.ASSOCIATES.map((a) => String(a || "").trim()).filter(Boolean);
    if (cleanAssoc.length > 0) result.ASSOCIATES = cleanAssoc;
  }

  if (record.IDDEF) {
    const { IDPREFIX, SEQUENCELENGTH, SEQUENCERESET, SEQRESETPERIOD, IDPATTERN } = record.IDDEF;
    if (
      IDPREFIX?.trim() ||
      SEQUENCELENGTH ||
      SEQUENCERESET ||
      SEQRESETPERIOD?.trim() ||
      IDPATTERN?.trim()
    ) {
      result.IDDEF = {
        IDPREFIX: String(IDPREFIX || "").trim(),
        SEQUENCELENGTH: SEQUENCELENGTH || "",
        SEQUENCERESET: Boolean(SEQUENCERESET),
        SEQRESETPERIOD:
          (String(SEQRESETPERIOD || "")
            .trim()
            .toUpperCase() as "D" | "M" | "Y") || "",
        IDPATTERN: String(IDPATTERN || "").trim(),
      };
    }
  }

  result.PROPERTIES = (record.PROPERTIES || []).map((p, i) => sanitizeModelProperty(p, i));
  if (record.auditData) result.auditData = record.auditData;

  return result as ModelConfigRecord;
}
