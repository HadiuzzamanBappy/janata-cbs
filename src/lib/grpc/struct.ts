import "server-only";

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
 * Unwraps an array of record items from various backend response envelope structures.
 */
export function unwrapRecordsPayload(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const fields = obj.fields as Record<string, unknown> | undefined;
    const records = fields?.records as Record<string, unknown> | undefined;
    const listValue = records?.list_value as Record<string, unknown> | undefined;

    if (Array.isArray(listValue?.values)) return listValue.values;
    if (Array.isArray(obj.records)) return obj.records;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.branches)) return obj.branches;
    if (Array.isArray(obj.list)) return obj.list;
    return [obj];
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
