import {
  type EnquiryColumn,
  type EnquiryCommand,
  type EnquiryRow,
  type EnquirySchema,
  enquirySchemaSchema,
  type RawEnquiryWire,
  type RawInqCmd,
  type RawInqDef,
  type RawInqInfo,
  type RawInqSelectField,
  rawEnquiryWireSchema,
  type SelectionField,
  type SelectionOperand,
} from "@/lib/schemas";

function getScalar(fieldVal: unknown): unknown {
  if (typeof fieldVal === "object" && fieldVal !== null) {
    const v = fieldVal as Record<string, unknown>;
    if ("string_value" in v) return v.string_value;
    if ("number_value" in v) return v.number_value;
    if ("bool_value" in v) return v.bool_value;
    if ("null_value" in v) return null;
  }
  return fieldVal;
}

function unwrapStruct(structObj: unknown): Record<string, unknown> {
  if (!structObj || typeof structObj !== "object") return {};
  const s = structObj as Record<string, unknown>;
  const fields = (s.struct_value as { fields?: Record<string, unknown> })?.fields || s.fields || s;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = getScalar(val);
  }
  return result;
}

function unwrapList(listObj: unknown): unknown[] {
  if (!listObj || typeof listObj !== "object") return [];
  const l = listObj as Record<string, unknown>;
  if ("list_value" in l && typeof l.list_value === "object" && l.list_value !== null) {
    const inner = l.list_value as { values?: unknown[] };
    return Array.isArray(inner.values) ? inner.values : [];
  }
  if (Array.isArray(l.values)) return l.values;
  if (Array.isArray(listObj)) return listObj;
  return [];
}

/**
 * Extracts raw enquiry wire fields from Protobuf struct response envelope.
 */
export function extractRawEnquiry(rawPayload: unknown): RawEnquiryWire | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;

  const root = rawPayload as Record<string, unknown>;
  const topFields = (root.fields || root) as Record<string, unknown>;

  const recordId = String(getScalar(topFields.recordId) ?? "");
  if (!recordId) return null;

  // Extract INQInfo
  let inqInfo: RawInqInfo | undefined;
  if (topFields.INQInfo) {
    inqInfo = unwrapStruct(topFields.INQInfo) as RawInqInfo;
  }

  // Extract INQSelectField
  let selectFields: RawInqSelectField[] | undefined;
  if (topFields.INQSelectField) {
    const items = unwrapList(topFields.INQSelectField);
    selectFields = items.map((item) => unwrapStruct(item) as RawInqSelectField);
  }

  // Extract INQDef (Columns definition)
  let inqDefs: RawInqDef[] | undefined;
  if (topFields.INQDef) {
    const items = unwrapList(topFields.INQDef);
    inqDefs = items.map((item) => unwrapStruct(item) as RawInqDef);
  }

  // Extract INQCmds
  let inqCmds: RawInqCmd[] | undefined;
  if (topFields.INQCmds) {
    const items = unwrapList(topFields.INQCmds);
    inqCmds = items.map((item) => unwrapStruct(item) as RawInqCmd);
  }

  return {
    recordId,
    INQInfo: inqInfo,
    INQSelectField: selectFields,
    INQDef: inqDefs,
    INQCmds: inqCmds,
  };
}

/**
 * Parses raw CBS INQUIRY wire response and transforms into canonical EnquirySchema.
 */
export function parseEnquiry(
  rawPayload: unknown,
  commandFallback: string = "ENQUIRY",
): { success: true; data: EnquirySchema } | { success: false; error: string } {
  try {
    const raw = extractRawEnquiry(rawPayload);
    if (!raw) {
      return {
        success: false,
        error: "Failed to extract valid enquiry struct fields from payload",
      };
    }

    const validation = rawEnquiryWireSchema.safeParse(raw);
    if (!validation.success) {
      return {
        success: false,
        error: `Enquiry wire validation failed: ${validation.error.message}`,
      };
    }

    const validRaw = validation.data;
    const code = validRaw.recordId || commandFallback;
    const info = validRaw.INQInfo || {};

    const title = info.description || code;
    const controllerName = info.controllerName || "";
    const inqServicePath = info.inqServicePath || "";
    const perpageItem = Number.parseInt(String(info.perpageItem || 30), 10) || 30;
    const showSerial = info.showSerial !== false;
    const showPagination = info.showPagination !== false;
    const showBranchWise = Boolean(info.showBranchWise);

    // Transform selection criteria (filter out empty dummy items returned by CBS backend)
    const selectionFields: SelectionField[] = (validRaw.INQSelectField || [])
      .filter((sf) => Boolean(sf.selectFieldName && sf.selectFieldName.trim() !== ""))
      .map((sf) => {
        const typeStr = (sf.selectFieldType || "text").toLowerCase();
        const type: SelectionField["type"] =
          typeStr === "date"
            ? "date"
            : typeStr === "number" || typeStr === "numeric"
              ? "number"
              : typeStr === "select"
                ? "select"
                : "text";

        const rawOp = (sf.selectFieldOperator || sf.selectFieldOperatorFixed || "EQ").toUpperCase();
        const operand: SelectionOperand =
          rawOp === "LK" ||
          rawOp === "RG" ||
          rawOp === "NE" ||
          rawOp === "GT" ||
          rawOp === "LT" ||
          rawOp === "CT"
            ? (rawOp as SelectionOperand)
            : "EQ";

        return {
          id: sf.selectFieldName.trim(),
          label: sf.selectFieldDisplay?.trim() || sf.selectFieldName.trim(),
          type,
          operand,
          value: sf.selectFieldValue || "",
          required: Boolean(sf.selectFieldRequired),
        };
      });

    // Transform column definitions
    const columns: EnquiryColumn[] = (validRaw.INQDef || []).map((col) => {
      let align: EnquiryColumn["align"] = "left";
      let width: string | undefined;

      if (col.fieldLength) {
        const parts = col.fieldLength.split(",");
        if (parts[1]?.toUpperCase() === "R") align = "right";
        if (parts[1]?.toUpperCase() === "C") align = "center";
        const len = Number.parseInt(parts[0], 10);
        if (!Number.isNaN(len)) {
          width = `${Math.min(Math.max(len * 8, 80), 300)}px`;
        }
      }

      return {
        id: col.fieldName,
        label: col.fieldDisplay || col.fieldName,
        align,
        width,
        isMono:
          col.fieldName.toLowerCase().includes("id") ||
          col.fieldName.toLowerCase().includes("code"),
        isDrilldown: col.dataPassable === true,
      };
    });

    // Transform command buttons (row action commands)
    const commands: EnquiryCommand[] = (validRaw.INQCmds || [])
      .filter((cmd) => Boolean(cmd.cmdButton))
      .map((cmd) => ({
        cmdButton: cmd.cmdButton || "Action",
        cmdFor: cmd.cmdFor || "",
      }));

    const canonicalSchema: EnquirySchema = {
      code,
      title,
      description: info.description || undefined,
      controllerName,
      inqServicePath,
      perpageItem,
      showSerial,
      showPagination,
      showBranchWise,
      selectionFields,
      columns,
      commands,
    };

    const finalValidation = enquirySchemaSchema.safeParse(canonicalSchema);
    if (!finalValidation.success) {
      return {
        success: false,
        error: `Enquiry domain schema validation failed: ${finalValidation.error.message}`,
      };
    }

    return {
      success: true,
      data: finalValidation.data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error parsing enquiry wire payload",
    };
  }
}

/**
 * Parses raw CBS Inquiry dataset wire response (e.g. data.fields.records.list_value.values)
 * into typed flat EnquiryRow[] records.
 */
export function parseInquiryRecords(rawPayload: unknown): EnquiryRow[] {
  if (!rawPayload || typeof rawPayload !== "object") return [];

  const root = rawPayload as Record<string, unknown>;
  const data = (root.data || root) as Record<string, unknown>;
  const fields = (data.fields || data) as Record<string, unknown>;

  // Check if records list is present under data.fields.records
  const recordsField = fields.records || root.records;
  if (!recordsField) {
    // If payload is already an array of rows
    if (Array.isArray(rawPayload)) {
      return rawPayload.map((item, idx) => {
        const row = typeof item === "object" && item !== null ? item : {};
        return {
          id: String((row as Record<string, unknown>).id ?? (row as Record<string, unknown>).recordId ?? idx),
          ...(row as Record<string, unknown>),
        };
      });
    }
    return [];
  }

  const items = unwrapList(recordsField);

  return items.map((item, idx) => {
    const flatRecord = unwrapStruct(item);
    const id = String(
      flatRecord.id ||
      flatRecord.recordId ||
      flatRecord.txnReference ||
      flatRecord.accountNumber ||
      idx
    );

    return {
      id,
      ...flatRecord,
    };
  });
}

