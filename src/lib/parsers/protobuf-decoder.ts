/**
 * Universal CBS Protobuf & Dynamic Struct Data Normalizer.
 * Recursively decodes any Protobuf Struct / Value structure (string_value,
 * number_value, bool_value, list_value, struct_value, fields) into clean,
 * canonical JavaScript objects, arrays, and primitives.
 */
export function decodeProtobufValue<T = unknown>(val: unknown): T {
  if (val === null || val === undefined) return val as T;
  if (typeof val !== "object") return val as T;

  const obj = val as Record<string, unknown>;

  // 1. Protobuf Primitive wrappers
  if ("string_value" in obj) return obj.string_value as T;
  if ("number_value" in obj) return obj.number_value as T;
  if ("bool_value" in obj) return obj.bool_value as T;
  if ("null_value" in obj) return null as T;

  // 2. Protobuf List wrapper
  if ("list_value" in obj) {
    const list = obj.list_value as { values?: unknown[] };
    return (list.values || []).map(decodeProtobufValue) as T;
  }

  // 3. Protobuf Struct wrapper
  if ("struct_value" in obj) {
    const struct = obj.struct_value as { fields?: Record<string, unknown> };
    return decodeProtobufValue(struct.fields || {}) as T;
  }

  // 4. Fields dictionary wrapper
  if ("fields" in obj && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    return decodeProtobufValue(obj.fields) as T;
  }

  // 5. Standard Array
  if (Array.isArray(val)) {
    return val.map(decodeProtobufValue) as T;
  }

  // 6. Plain Dictionary / Record
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = decodeProtobufValue(v);
  }
  return result as T;
}

/**
 * Strictly unwraps an array of record items from canonical response envelopes
 * (data.records, data.fields.records, etc.) or direct arrays.
 */
export function unwrapRecordsPayload<T = unknown>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.map((d) => decodeProtobufValue<T>(d));

  const decoded = decodeProtobufValue<Record<string, unknown>>(data);
  if (decoded && typeof decoded === "object") {
    if (Array.isArray(decoded.records)) {
      return decoded.records as T[];
    }
  }

  return [];
}
