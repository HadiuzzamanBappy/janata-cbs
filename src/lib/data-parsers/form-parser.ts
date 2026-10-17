import {
  type FormFieldItem,
  type FormWidgetType,
  type ParsedFormData,
  parsedFormDataSchema,
  type RawPropertyConfigRecord,
  type RawPropertyRecord,
  rawPropertyConfigSchema,
} from "@/lib/data-schemas";
import { decodeProtobufValue } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Field Mapping Utilities                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Maps field length to standard 12-column responsive grid span.
 */
export function colSpanForLength(length?: number | string): number {
  const num = typeof length === "string" ? Number.parseInt(length, 10) : length;
  if (!num || Number.isNaN(num)) return 6;
  if (num <= 4) return 3;
  if (num <= 12) return 4;
  if (num <= 24) return 6;
  return 12;
}

/**
 * Maps SQL / CBS column types to canonical FormWidgetType.
 */
export function mapRawTypeToWidget(sqlType?: string, datasource?: string[]): FormWidgetType {
  if (datasource && datasource.length > 0) return "select";
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
  if (t.includes("BOOL")) return "switch";
  if (t.includes("TEXT") || t.includes("CLOB")) return "textarea";
  return "text";
}

/**
 * Maps SQL / CBS column types to MODEL.CONFIG PropertyType string.
 */
export function mapRawTypeToModelType(sqlType?: string): string {
  const t = (sqlType ?? "").toUpperCase();
  if (t.includes("DATE") || t.includes("TIME")) return "Date";
  if (
    t.includes("INT") ||
    t.includes("DEC") ||
    t.includes("NUM") ||
    t.includes("DOUBLE") ||
    t.includes("FLOAT")
  ) {
    return "Number";
  }
  if (t.includes("BOOL")) return "Boolean";
  return "Text";
}

function truthy(val: unknown): boolean {
  return val === true || val === "Y" || val === "YES" || val === "1" || val === 1;
}

/**
 * Maps a raw property record to a canonical FormFieldItem descriptor.
 */
export function toField(record: RawPropertyRecord): FormFieldItem {
  const fieldKey = record.name ?? "";
  const label = record.label ?? fieldKey;
  const options =
    Array.isArray(record.datasource) && record.datasource.length > 0
      ? record.datasource
      : undefined;

  return {
    id: `f_${fieldKey || Date.now()}`,
    fieldKey,
    label,
    widget: mapRawTypeToWidget(record.type, options),
    colSpan: colSpanForLength(record.length),
    required: truthy(record.required),
    readOnly: truthy(record.disabled),
    options,
    modelType: mapRawTypeToModelType(record.type),
  };
}

/* -------------------------------------------------------------------------- */
/* Wire Parser API                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Parses raw GMC (Generic Model Controller) payload into a validated ParsedFormData.
 */
export function parseGMC(
  rawPayload: unknown,
  commandFallback = "FORM",
): { success: true; data: ParsedFormData } | { success: false; error: string } {
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

  const fields = properties.map(toField).filter((f) => Boolean(f.fieldKey));

  const candidateForm: ParsedFormData = {
    code,
    title: record.description ?? code,
    idPrefix,
    fields,
    columns: record.columns,
  };

  const finalCheck = parsedFormDataSchema.safeParse(candidateForm);
  if (!finalCheck.success) {
    return {
      success: false,
      error: `ParsedFormData validation failed: ${finalCheck.error.message}`,
    };
  }

  return { success: true, data: finalCheck.data };
}
