import {
  type EnquiryColumn,
  type EnquiryCommand,
  type EnquiryRow,
  type EnquirySchema,
  enquirySchemaSchema,
  type RawEnquiryWire,
  rawEnquiryWireSchema,
  type SelectionField,
  type SelectionOperand,
} from "@/lib/data-schemas";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/**
 * Extracts raw enquiry wire fields from Protobuf struct response envelope.
 */
export function extractRawEnquiry(rawPayload: unknown): RawEnquiryWire | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const root = (decoded.record || decoded) as Record<string, unknown>;

  const recordId = String(root.recordId || "");
  if (!recordId) return null;

  return {
    recordId,
    auditData: root.auditData as RawEnquiryWire["auditData"],
    INQInfo: root.INQInfo as RawEnquiryWire["INQInfo"],
    INQSelectField: Array.isArray(root.INQSelectField)
      ? (root.INQSelectField as RawEnquiryWire["INQSelectField"])
      : undefined,
    INQDef: Array.isArray(root.INQDef) ? (root.INQDef as RawEnquiryWire["INQDef"]) : undefined,
    INQCmds: Array.isArray(root.INQCmds) ? (root.INQCmds as RawEnquiryWire["INQCmds"]) : undefined,
  };
}

/**
 * Parses raw CBS INQUIRY wire response and transforms into canonical EnquirySchema.
 */
export function parseEnquiry(
  rawPayload: unknown,
  commandFallback = "ENQUIRY",
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
 * Parses raw CBS Inquiry dataset wire response into typed flat EnquiryRow[] records.
 */
export function parseInquiryRecords(rawPayload: unknown): EnquiryRow[] {
  if (!rawPayload) return [];

  // If already an array of raw items, decode them directly
  if (Array.isArray(rawPayload)) {
    return rawPayload.map((item, idx) => {
      const row = decodeProtobufValue<Record<string, unknown>>(item) || {};
      const id = String(row.id || row.recordId || row.txnReference || row.accountNumber || idx);
      return { id, ...row };
    });
  }

  // Use unwrapRecordsPayload to pull data.records or data.fields.records
  const records = unwrapRecordsPayload<Record<string, unknown>>(rawPayload);
  return records.map((item, idx) => {
    const id = String(item.id || item.recordId || item.txnReference || item.accountNumber || idx);
    return { id, ...item };
  });
}
