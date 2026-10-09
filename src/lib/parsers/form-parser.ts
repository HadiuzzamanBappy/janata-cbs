import {
  type FieldType,
  type FieldWidth,
  type FormField,
  type FormSchema,
  formSchemaSchema,
  type RawPropertyConfigRecord,
  type RawPropertyRecord,
  rawPropertyConfigSchema,
} from "@/lib/schemas";

export function widthForLength(length?: number | string): FieldWidth {
  const num = typeof length === "string" ? Number.parseInt(length, 10) : length;
  if (!num || Number.isNaN(num)) return "md";
  if (num <= 4) return "xs";
  if (num <= 12) return "sm";
  if (num <= 24) return "md";
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

function extractRawField(fieldNode: unknown): RawPropertyRecord {
  if (!fieldNode || typeof fieldNode !== "object") return {};
  const obj = fieldNode as Record<string, unknown>;

  const structVal = (obj.struct_value || obj) as Record<string, unknown>;
  const fields = (structVal.fields || structVal) as Record<string, unknown>;

  const getValue = (val: unknown): unknown => {
    if (typeof val === "object" && val !== null) {
      const v = val as Record<string, unknown>;
      if ("string_value" in v) return v.string_value;
      if ("number_value" in v) return v.number_value;
      if ("bool_value" in v) return v.bool_value;
      if ("list_value" in v && typeof v.list_value === "object" && v.list_value !== null) {
        const lv = v.list_value as Record<string, unknown>;
        if (Array.isArray(lv.values)) {
          return lv.values.map(getValue);
        }
      }
      if ("struct_value" in v) return extractRawField(v);
    }
    return val;
  };

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = getValue(v);
  }

  return result as RawPropertyRecord;
}

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

  const obj = rawPayload as Record<string, unknown>;
  const topFields = (obj.fields || obj) as Record<string, unknown>;
  const recordWrapper = (topFields.record || topFields) as Record<string, unknown>;
  const recordStruct = (recordWrapper.struct_value || recordWrapper) as Record<string, unknown>;
  const recordFields = (recordStruct.fields || recordStruct) as Record<string, unknown>;

  const getScalar = (fieldVal: unknown): unknown => {
    if (typeof fieldVal === "object" && fieldVal !== null) {
      const v = fieldVal as Record<string, unknown>;
      if ("string_value" in v) return v.string_value;
      if ("number_value" in v) return v.number_value;
      if ("bool_value" in v) return v.bool_value;
    }
    return fieldVal;
  };

  const tableName = String(
    getScalar(recordFields.tableName ?? recordFields.TABLENAME) ?? commandFallback,
  );
  const description = String(
    getScalar(recordFields.description ?? recordFields.DESCRIPTION) ?? tableName,
  );

  let propertiesRaw: unknown[] = [];
  const propsField = (recordFields.properties ?? recordFields.PROPERTIES) as
    | Record<string, unknown>
    | undefined;
  if (propsField && typeof propsField === "object" && "list_value" in propsField) {
    const listVal = propsField.list_value as Record<string, unknown>;
    if (Array.isArray(listVal.values)) {
      propertiesRaw = listVal.values;
    }
  } else if (Array.isArray(recordFields.properties)) {
    propertiesRaw = recordFields.properties;
  } else if (Array.isArray(recordFields.PROPERTIES)) {
    propertiesRaw = recordFields.PROPERTIES;
  }

  const rawProperties = propertiesRaw.map(extractRawField);

  // Extract idDef if present
  let idDefRaw: { IDPREFIX?: string } | undefined;
  const idDefObj = (recordFields.idDef ?? recordFields.IDDEF) as
    | Record<string, unknown>
    | undefined;
  if (idDefObj && typeof idDefObj === "object") {
    const idDefFields =
      (idDefObj.struct_value as { fields?: Record<string, unknown> })?.fields || idDefObj;
    const prefix = getScalar(
      (idDefFields as Record<string, unknown>).idPrefix ??
        (idDefFields as Record<string, unknown>).IDPREFIX,
    );
    if (prefix) {
      idDefRaw = { IDPREFIX: String(prefix) };
    }
  }

  // Extract columns if present (for enquiry screens)
  let columnsRaw: RawPropertyConfigRecord["columns"];
  const columnsField = recordFields.columns ?? recordFields.COLUMNS;
  if (Array.isArray(columnsField)) {
    columnsRaw = columnsField as RawPropertyConfigRecord["columns"];
  } else if (columnsField && typeof columnsField === "object" && "list_value" in columnsField) {
    const listVal = (columnsField as Record<string, unknown>).list_value as Record<string, unknown>;
    if (Array.isArray(listVal?.values)) {
      columnsRaw = listVal.values.map(
        extractRawField,
      ) as unknown as RawPropertyConfigRecord["columns"];
    }
  }

  const rawConfig: RawPropertyConfigRecord = {
    tableName,
    description,
    idDef: idDefRaw ? { idPrefix: idDefRaw.IDPREFIX } : undefined,
    properties: rawProperties,
    columns: columnsRaw,
  };

  const parseResult = rawPropertyConfigSchema.safeParse(rawConfig);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Zod validation error: ${parseResult.error.message}`,
    };
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
