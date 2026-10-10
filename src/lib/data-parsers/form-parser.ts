import {
  type FieldType,
  type FieldWidth,
  type FormField,
  type FormSchema,
  formSchemaSchema,
  type RawPropertyConfigRecord,
  type RawPropertyRecord,
  rawPropertyConfigSchema,
} from "@/lib/data-schemas";
import { decodeProtobufValue } from "./protobuf-decoder";

/**
 * Maps field length to standard UI width classes.
 */
export function widthForLength(length?: number | string): FieldWidth {
  const num = typeof length === "string" ? Number.parseInt(length, 10) : length;
  if (!num || Number.isNaN(num)) return "md";
  if (num <= 4) return "xs";
  if (num <= 12) return "sm";
  if (num <= 24) return "md";
  return "lg";
}

/**
 * Maps SQL / CBS column types to canonical UI field input types.
 */
export function typeForColumn(sqlType?: string): FieldType {
  const t = (sqlType ?? "").toUpperCase();
  if (t.includes("DATE") || t.includes("TIME")) return "date";
  if (
    t.includes("INT") ||
    t.includes("DEC") ||
    t.includes("NUM") ||
    t.includes("DOUBLE") ||
    t.includes("FLOAT")
  ) {
    return "number";
  }
  return "text";
}

function truthy(val: unknown): boolean {
  return val === true || val === "Y" || val === "YES" || val === "1" || val === 1;
}

/**
 * Maps a raw property record to a canonical UI FormField descriptor.
 */
export function toField(record: RawPropertyRecord): FormField {
  const name = record.name ?? "";
  const label = record.label ?? name;
  const options =
    Array.isArray(record.datasource) && record.datasource.length > 0
      ? record.datasource
      : undefined;

  const rawType = (record.type ?? "").toLowerCase();

  let fieldType: FieldType = "text";
  if (options?.length) {
    fieldType = "select";
  } else if (rawType.includes("date")) {
    fieldType = "date";
  } else if (rawType.includes("number") || rawType.includes("numeric") || rawType.includes("int")) {
    fieldType = "number";
  } else {
    fieldType = typeForColumn(record.type);
  }

  return {
    name,
    label,
    type: fieldType,
    width: widthForLength(record.length),
    required: truthy(record.required),
    readOnly: truthy(record.disabled),
    options,
  };
}

/**
 * Parses raw GMC (Generic Model Controller) payload into a validated FormSchema.
 */
export function parseGMC(
  rawPayload: unknown,
  commandFallback = "FORM",
): { success: true; data: FormSchema } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "GMC payload is null, undefined, or invalid object" };
  }

  // Use universal protobuf decoder to recursively unwrap all struct_values and fields
  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const recordWrapper = (decoded.record || decoded) as Record<string, unknown>;
  const recordFields = (recordWrapper.record || recordWrapper) as Record<string, unknown>;

  const tableName = String(recordFields.tableName ?? commandFallback);
  const description = String(recordFields.description ?? tableName);
  const propertiesRaw = Array.isArray(recordFields.properties) ? recordFields.properties : [];
  const rawProperties = propertiesRaw.map((p) => p as RawPropertyRecord);

  const rawConfig: RawPropertyConfigRecord = {
    tableName,
    description,
    idDef: recordFields.idDef as RawPropertyConfigRecord["idDef"],
    properties: rawProperties,
    columns: recordFields.columns as RawPropertyConfigRecord["columns"],
  };

  const parseResult = rawPropertyConfigSchema.safeParse(rawConfig);
  if (!parseResult.success) {
    return { success: false, error: `Zod validation error: ${parseResult.error.message}` };
  }

  const record = parseResult.data;
  const code = (record.tableName ?? commandFallback).toUpperCase();
  const properties = record.properties ?? [];

  const idPrefix =
    record.idDef?.idPrefix ??
    code
      .split(".")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2);

  const fields = properties.map(toField).filter((f: FormField) => Boolean(f.name));

  const candidateForm: FormSchema = {
    code,
    title: record.description ?? code,
    idPrefix,
    fields,
    columns: record.columns,
  };

  const finalCheck = formSchemaSchema.safeParse(candidateForm);
  if (!finalCheck.success) {
    return { success: false, error: `FormSchema validation failed: ${finalCheck.error.message}` };
  }

  return { success: true, data: finalCheck.data };
}
