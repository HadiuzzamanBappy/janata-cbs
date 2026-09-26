import {
  type FieldType,
  type FieldWidth,
  type FormField,
  type FormSchema,
  formSchemaSchema,
  type RawPropertyConfigRecord,
  type RawPropertyRecord,
  rawPropertyConfigSchema,
} from "./schemas";

export function widthForLength(length?: number): FieldWidth {
  if (!length) return "md";
  if (length <= 4) return "xs";
  if (length <= 12) return "sm";
  if (length <= 24) return "md";
  return "lg";
}

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

export function toField(record: RawPropertyRecord): FormField {
  const name = record.NAME ?? "";
  const options =
    Array.isArray(record.DATASOURCE) && record.DATASOURCE.length > 0
      ? record.DATASOURCE
      : undefined;

  const rawType = (record.TYPE ?? "").toLowerCase();

  let fieldType: FieldType = "text";
  if (options?.length) {
    fieldType = "select";
  } else if (rawType.includes("date")) {
    fieldType = "date";
  } else if (rawType.includes("number") || rawType.includes("numeric") || rawType.includes("int")) {
    fieldType = "number";
  } else {
    fieldType = typeForColumn(record.TYPE);
  }

  return {
    name,
    label: record.LABEL ?? name,
    type: fieldType,
    width: widthForLength(record.LENGTH),
    required: truthy(record.REQUIRED),
    readOnly: truthy(record.DISABLED),
    options,
  };
}

/**
 * Parses raw GMC backend payloads into a validated FormSchema object.
 * Guarantees zero crashes on malformed backend responses by returning structured errors.
 */
export function parseGMC(
  rawPayload: unknown,
  commandFallback: string = "FORM",
): { success: true; data: FormSchema } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return {
      success: false,
      error: "GMC payload is null, undefined, or invalid object",
    };
  }

  const parseResult = rawPropertyConfigSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Zod validation error: ${parseResult.error.message}`,
    };
  }

  const rawConfig: RawPropertyConfigRecord = parseResult.data;
  const record = rawConfig.record ?? rawConfig;
  const code = (record.TABLENAME ?? commandFallback).toUpperCase();
  const properties = record.PROPERTIES ?? [];

  const idPrefix =
    record.IDDEF?.IDPREFIX ??
    code
      .split(".")
      .map((part) => part[0])
      .join("")
      .slice(0, 2);

  const fields = properties.map(toField).filter((f) => Boolean(f.name));

  const candidateForm: FormSchema = {
    code,
    title: record.DESCRIPTION ?? code,
    idPrefix,
    fields,
  };

  const finalCheck = formSchemaSchema.safeParse(candidateForm);
  if (!finalCheck.success) {
    return {
      success: false,
      error: `FormSchema validation failed: ${finalCheck.error.message}`,
    };
  }

  return {
    success: true,
    data: finalCheck.data,
  };
}
