import {
  type EnquiryRow,
  type INQDef,
  type INQInfo,
  type INQSelectField,
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas/inquiry-config-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Inbound Wire Envelope Normalizer                                           */
/* -------------------------------------------------------------------------- */

function normalizeInquiryTarget(target: unknown): Record<string, unknown> | null {
  if (!target || typeof target !== "object") return null;

  let rec = target as Record<string, unknown>;

  if (rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)) {
    rec = rec.data as Record<string, unknown>;
  }
  if (rec.record && typeof rec.record === "object" && !Array.isArray(rec.record)) {
    rec = rec.record as Record<string, unknown>;
  }

  const inqInfo = rec.INQInfo && typeof rec.INQInfo === "object" ? rec.INQInfo : rec;

  return {
    ...rec,
    INQInfo: inqInfo,
    INQSelectField: Array.isArray(rec.INQSelectField) ? rec.INQSelectField : [],
    INQDef: Array.isArray(rec.INQDef) ? rec.INQDef : [],
    INQCmds: Array.isArray(rec.INQCmds) ? rec.INQCmds : [],
    auditData: rec.auditData ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Single Record Parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound wire payload into a strictly validated, defensively sanitized InquiryConfigRecord.
 */
export function parseInquiryConfig(
  rawPayload: unknown,
): { success: true; data: InquiryConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Inquiry config payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload<Record<string, unknown>>(decoded);
  const target = normalizeInquiryTarget(list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded));

  if (!target) {
    return { success: false, error: "Inquiry config record is empty or invalid" };
  }

  const parseResult = inquiryConfigRecordSchema.safeParse(target);
  if (!parseResult.success) {
    return {
      success: false,
      error: `InquiryConfig validation failed: ${parseResult.error.message}`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* Dataset Rows Parser (for runtime tabular enquiry queries)                  */
/* -------------------------------------------------------------------------- */

/**
 * Unpacks tabular records from query execution responses into typed EnquiryRow array.
 */
export function parseInquiryRecords(rawPayload: unknown): EnquiryRow[] {
  if (!rawPayload) return [];

  const records = unwrapRecordsPayload<Record<string, unknown>>(rawPayload);
  return records.map((item, idx) => {
    const rawId = item.id ?? item.recordId ?? item.txnReference ?? item.accountNumber;
    const cleanId =
      rawId !== undefined && rawId !== null && String(rawId).trim() !== ""
        ? String(rawId).trim()
        : `row_${idx + 1}`;

    return {
      ...item,
      id: cleanId,
      recordId:
        typeof item.recordId === "string" && item.recordId.trim() !== ""
          ? item.recordId.trim()
          : cleanId,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Outbound Database Serializers & Query Sanitizers                           */
/* -------------------------------------------------------------------------- */

export function sanitizeInqSelectField(f: INQSelectField): INQSelectField {
  return {
    selectFieldName: f.selectFieldName?.trim() || "",
    selectFieldDisplay: f.selectFieldDisplay?.trim() || f.selectFieldName?.trim() || "",
    selectFieldType: f.selectFieldType || "text",
    selectFieldOperator: f.selectFieldOperator || "EQ",
    selectFieldOperatorFixed: f.selectFieldOperatorFixed?.trim() || "",
    selectFieldValue: f.selectFieldValue?.trim() || "",
    selectFieldRequired: Boolean(f.selectFieldRequired),
  };
}

export function sanitizeInqDef(col: INQDef): INQDef {
  return {
    fieldName: col.fieldName?.trim() || "",
    fieldDisplay: col.fieldDisplay?.trim() || col.fieldName?.trim() || "",
    fieldType: col.fieldType?.trim() || "DC",
    fieldFunc: col.fieldFunc?.trim() || "",
    fieldRowCol: col.fieldRowCol?.trim() || "1,1",
    fieldLength: col.fieldLength?.trim() || "20,L",
    dataPassable: col.dataPassable === true ? true : col.dataPassable === false ? false : null,
  };
}

/**
 * Produces a clean, normalized InquiryConfigRecord aligned 1:1 with the canonical schema.
 */
export function sanitizeInquiryConfigRecord(
  record?: InquiryConfigRecord,
): InquiryConfigRecord | undefined {
  if (!record) return undefined;

  const inqInfo: INQInfo = {
    controllerName: String(record.INQInfo?.controllerName || "").trim(),
    description: String(record.INQInfo?.description || "").trim(),
    pageOrientation:
      record.INQInfo?.pageOrientation?.trim() === "Landscape" ? "Landscape" : "Portrait",
    perpageItem: String(record.INQInfo?.perpageItem || "30").trim() || "30",
    showSerial: Boolean(record.INQInfo?.showSerial),
    showPagination: Boolean(record.INQInfo?.showPagination),
    showBranchWise: Boolean(record.INQInfo?.showBranchWise),
    inqType: record.INQInfo?.inqType?.trim() || "DFT",
    rptControllerName: String(record.INQInfo?.rptControllerName || "").trim(),
    fixedSelection: String(record.INQInfo?.fixedSelection || "").trim(),
    inqServicePath: String(record.INQInfo?.inqServicePath || "default").trim(),
    cmdFromInternal: Boolean(record.INQInfo?.cmdFromInternal),
    cmdFieldName: String(record.INQInfo?.cmdFieldName || "").trim(),
  };

  const result: InquiryConfigRecord = {
    INQInfo: inqInfo,
    INQSelectField: (record.INQSelectField || []).map(sanitizeInqSelectField),
    INQDef: (record.INQDef || []).map(sanitizeInqDef),
    INQCmds: (record.INQCmds || []).map((cmd) => ({
      cmdFor: cmd.cmdFor?.trim() || "",
      cmdButton: cmd.cmdButton?.trim() || "",
    })),
  };

  if (record.auditData) result.auditData = record.auditData;
  return result;
}
