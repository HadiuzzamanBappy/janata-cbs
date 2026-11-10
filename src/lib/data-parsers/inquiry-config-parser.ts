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
/* Constants & Sanitization Fields                                            */
/* -------------------------------------------------------------------------- */

const INQ_INFO_BOOLEANS = [
  "showSerial",
  "showPagination",
  "showBranchWise",
  "cmdFromInternal",
] as const;

const INQ_INFO_STRINGS = ["fixedSelection", "rptControllerName", "cmdFieldName"] as const;

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

  const rawInq =
    rec.INQInfo && typeof rec.INQInfo === "object" ? (rec.INQInfo as Record<string, unknown>) : {};

  return {
    ...rec,
    INQInfo: {
      controllerName: String(rawInq.controllerName ?? rec.controllerName ?? "").trim(),
      description: String(rawInq.description ?? rec.description ?? "").trim(),
      pageOrientation: rawInq.pageOrientation ?? rec.pageOrientation ?? "Portrait",
      perpageItem: String(rawInq.perpageItem ?? rec.perpageItem ?? "30"),
      showSerial: Boolean(rawInq.showSerial ?? rec.showSerial),
      showPagination: Boolean(rawInq.showPagination ?? rec.showPagination),
      showBranchWise: Boolean(rawInq.showBranchWise ?? rec.showBranchWise),
      inqType: rawInq.inqType ?? rec.inqType ?? "DFT",
      rptControllerName: String(rawInq.rptControllerName ?? rec.rptControllerName ?? "").trim(),
      fixedSelection: String(rawInq.fixedSelection ?? rec.fixedSelection ?? "").trim(),
      inqServicePath: String(rawInq.inqServicePath ?? rec.inqServicePath ?? "default").trim(),
      cmdFromInternal: Boolean(rawInq.cmdFromInternal ?? rec.cmdFromInternal),
      cmdFieldName: String(rawInq.cmdFieldName ?? rec.cmdFieldName ?? "").trim(),
    },
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
    data: sanitizeInquiryConfigRecord(parseResult.data) ?? parseResult.data,
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
  const result: Partial<INQSelectField> = {
    selectFieldName: f.selectFieldName.trim(),
    selectFieldDisplay: (f.selectFieldDisplay || f.selectFieldName).trim(),
    selectFieldType: f.selectFieldType || "text",
    selectFieldOperator: f.selectFieldOperator || "EQ",
  };
  if (f.selectFieldValue?.trim()) result.selectFieldValue = f.selectFieldValue.trim();
  if (f.selectFieldRequired) result.selectFieldRequired = true;
  if (f.selectFieldOperatorFixed?.trim()) {
    result.selectFieldOperatorFixed = f.selectFieldOperatorFixed.trim();
  }
  return result as INQSelectField;
}

export function sanitizeInqDef(col: INQDef): INQDef {
  const result: Partial<INQDef> = {
    fieldName: col.fieldName.trim(),
    fieldDisplay: (col.fieldDisplay || col.fieldName).trim(),
    fieldType: col.fieldType || "DC",
    fieldLength: col.fieldLength || "20,L",
    fieldRowCol: col.fieldRowCol || "1,1",
  };
  if (col.fieldFunc?.trim()) result.fieldFunc = col.fieldFunc.trim();
  if (col.dataPassable) result.dataPassable = true;
  return result as INQDef;
}

/**
 * Produces a clean, sparse InquiryConfigRecord ready for database persistence.
 */
export function sanitizeInquiryConfigRecord(
  record?: InquiryConfigRecord,
): InquiryConfigRecord | undefined {
  if (!record) return undefined;

  const inqInfo: Partial<INQInfo> = {
    controllerName: String(record.INQInfo?.controllerName || "").trim(),
    description: String(record.INQInfo?.description || "").trim(),
    inqServicePath: String(record.INQInfo?.inqServicePath || "default").trim(),
    inqType: record.INQInfo?.inqType || "DFT",
    pageOrientation: record.INQInfo?.pageOrientation || "Portrait",
    perpageItem: String(record.INQInfo?.perpageItem || "30"),
  };

  for (const b of INQ_INFO_BOOLEANS) {
    if (record.INQInfo?.[b]) inqInfo[b] = true;
  }
  for (const s of INQ_INFO_STRINGS) {
    const val = record.INQInfo?.[s];
    if (val?.trim()) inqInfo[s] = val.trim();
  }

  const result: Partial<InquiryConfigRecord> = {
    INQInfo: inqInfo as INQInfo,
    INQSelectField: (record.INQSelectField || []).map(sanitizeInqSelectField),
    INQDef: (record.INQDef || []).map(sanitizeInqDef),
    INQCmds: (record.INQCmds || []).map((cmd) => ({
      cmdButton: cmd.cmdButton.trim(),
      cmdFor: cmd.cmdFor.trim(),
    })),
  };

  if (record.auditData) result.auditData = record.auditData;
  return result as InquiryConfigRecord;
}
