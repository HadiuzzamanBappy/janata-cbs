/**
 * Pure data transformation helpers for normalizing dynamic CBS Protobuf struct payloads.
 * Safe for both server execution and node test runners.
 */
/**
 * Extracts a flattened string map or primitive values from a dynamic gRPC struct payload.
 * Normalizes differences between direct JSON objects and Protobuf struct/list values.
 */
export function extractStringField(
  fields: Record<string, unknown> | undefined,
  key: string,
): string {
  if (!fields) return "";
  const val = fields[key];
  if (typeof val === "object" && val !== null && "string_value" in val) {
    const structStr = (val as { string_value?: string }).string_value;
    return typeof structStr === "string" ? structStr : "";
  }
  return typeof val === "string" ? val : "";
}

/**
 * Extracts a boolean value from either a raw boolean or a protobuf bool_value struct.
 */
export function extractBooleanField(
  fields: Record<string, unknown> | undefined,
  key: string,
  defaultValue = false,
): boolean {
  if (!fields) return defaultValue;
  const val = fields[key];
  if (typeof val === "object" && val !== null && "bool_value" in val) {
    const boolVal = (val as { bool_value?: boolean }).bool_value;
    return typeof boolVal === "boolean" ? boolVal : defaultValue;
  }
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return defaultValue;
}

/**
 * Extracts a number value from either a raw number or a protobuf number_value struct.
 */
export function extractNumberField(
  fields: Record<string, unknown> | undefined,
  key: string,
  defaultValue = 0,
): number {
  if (!fields) return defaultValue;
  const val = fields[key];
  if (typeof val === "object" && val !== null && "number_value" in val) {
    const numVal = (val as { number_value?: number }).number_value;
    return typeof numVal === "number" ? numVal : defaultValue;
  }
  if (typeof val === "number") return val;
  if (typeof val === "string" && !Number.isNaN(Number(val))) return Number(val);
  return defaultValue;
}

/**
 * Normalizes either raw plain objects or protobuf struct_value wrappers into a flat dictionary.
 */
export function unwrapStructPayload(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;
  if (obj.fields && typeof obj.fields === "object") {
    return obj.fields as Record<string, unknown>;
  }
  return obj;
}

/**
 * Strictly unwraps an array of record items from canonical gRPC response envelopes
 * (data.fields.records.list_value.values) or direct arrays from static fixtures.
 */
export function unwrapRecordsPayload(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    // Case 1: Already unwrapped by ts-proto (obj.records is a direct array)
    if (Array.isArray(obj.records)) {
      return obj.records;
    }

    // Case 2: obj.records wrapped in list_value
    const directRecords = obj.records as Record<string, unknown> | undefined;
    if (directRecords && typeof directRecords === "object") {
      const listVal = directRecords.list_value as Record<string, unknown> | undefined;
      if (Array.isArray(listVal?.values)) return listVal.values;
    }

    // Case 3: Canonical protobuf wrapper (obj.fields.records...)
    const fields = obj.fields as Record<string, unknown> | undefined;
    if (fields && typeof fields === "object") {
      if (Array.isArray(fields.records)) {
        return fields.records;
      }
      const records = fields.records as Record<string, unknown> | undefined;
      const listValue = records?.list_value as Record<string, unknown> | undefined;
      if (Array.isArray(listValue?.values)) return listValue.values;
    }
  }

  return [];
}

/**
 * Resolves item fields from an unwrapped record item.
 */
export function getItemFields(item: unknown): Record<string, unknown> | undefined {
  if (typeof item !== "object" || item === null) return undefined;
  const itemObj = item as Record<string, unknown>;
  const structVal = itemObj.struct_value as Record<string, unknown> | undefined;
  return (structVal?.fields || itemObj.fields || itemObj) as Record<string, unknown> | undefined;
}
