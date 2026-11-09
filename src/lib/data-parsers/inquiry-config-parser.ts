import { z } from "zod";
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
/* Inbound Wire Envelope Normalizer (Zero Legacy)                             */
/* -------------------------------------------------------------------------- */

function normalizeInquiryTarget(target: unknown): Record<string, unknown> | null {
  if (!target || typeof target !== "object") return null;

  let rec = target as Record<string, unknown>;

  // Unwrap standard response envelopes: { data: { record: ... } } or { data: ... }
  if (rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)) {
    rec = rec.data as Record<string, unknown>;
  }
  if (rec.record && typeof rec.record === "object" && !Array.isArray(rec.record)) {
    rec = rec.record as Record<string, unknown>;
  }

  const rawInqInfo =
    rec.INQInfo && typeof rec.INQInfo === "object" ? (rec.INQInfo as Record<string, unknown>) : {};

  return {
    ...rec,
    INQInfo: {
      controllerName: rawInqInfo.controllerName ?? rec.controllerName ?? "",
      description: rawInqInfo.description ?? rec.description ?? "",
      pageOrientation: rawInqInfo.pageOrientation ?? rec.pageOrientation ?? "Portrait",
      perpageItem: rawInqInfo.perpageItem ?? rec.perpageItem ?? "30",
      showSerial: rawInqInfo.showSerial ?? rec.showSerial ?? false,
      showPagination: rawInqInfo.showPagination ?? rec.showPagination ?? false,
      showBranchWise: rawInqInfo.showBranchWise ?? rec.showBranchWise ?? false,
      inqType: rawInqInfo.inqType ?? rec.inqType ?? "DFT",
      rptControllerName: rawInqInfo.rptControllerName ?? rec.rptControllerName ?? "",
      fixedSelection: rawInqInfo.fixedSelection ?? rec.fixedSelection ?? "",
      inqServicePath: rawInqInfo.inqServicePath ?? rec.inqServicePath ?? "default",
      cmdFromInternal: rawInqInfo.cmdFromInternal ?? rec.cmdFromInternal ?? false,
      cmdFieldName: rawInqInfo.cmdFieldName ?? rec.cmdFieldName ?? "",
    },
    INQSelectField: Array.isArray(rec.INQSelectField) ? rec.INQSelectField : [],
    INQDef: Array.isArray(rec.INQDef) ? rec.INQDef : [],
    INQCmds: Array.isArray(rec.INQCmds) ? rec.INQCmds : [],
    auditData: rec.auditData ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Single Record & List Parsers                                               */
/* -------------------------------------------------------------------------- */

export function parseInquiryConfig(
  rawPayload: unknown,
): { success: true; data: InquiryConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Inquiry config payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload<Record<string, unknown>>(decoded);
  const rawTarget = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);
  const target = normalizeInquiryTarget(rawTarget);

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

  return { success: true, data: parseResult.data };
}

export function parseInquiryConfigList(
  rawPayload: unknown,
): { success: true; data: InquiryConfigRecord[] } | { success: false; error: string } {
  if (!rawPayload) return { success: true, data: [] };

  const rawList = unwrapRecordsPayload<unknown>(rawPayload);
  const candidates = rawList.length > 0 ? rawList : Array.isArray(rawPayload) ? rawPayload : [];
  const normalized = candidates
    .map(normalizeInquiryTarget)
    .filter((t): t is Record<string, unknown> => t !== null);

  const parseResult = z.array(inquiryConfigRecordSchema).safeParse(normalized);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Inquiry config list validation failed: ${parseResult.error.message}`,
    };
  }

  return { success: true, data: parseResult.data };
}

/* -------------------------------------------------------------------------- */
/* Dataset Rows Parser                                                        */
/* -------------------------------------------------------------------------- */

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
/* Sanitizers & Wire Serializers                                              */
/* -------------------------------------------------------------------------- */

export function sanitizeInqSelectField(f: INQSelectField): INQSelectField {
  const result: Partial<INQSelectField> = {
    selectFieldName: f.selectFieldName,
    selectFieldDisplay: f.selectFieldDisplay || f.selectFieldName,
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
    fieldName: col.fieldName,
    fieldDisplay: col.fieldDisplay || col.fieldName,
    fieldType: col.fieldType || "DC",
    fieldLength: col.fieldLength || "20,L",
    fieldRowCol: col.fieldRowCol || "1,1",
  };
  if (col.fieldFunc?.trim()) result.fieldFunc = col.fieldFunc.trim();
  if (col.dataPassable) result.dataPassable = true;
  return result as INQDef;
}

export function sanitizeInquiryConfigRecord(
  record?: InquiryConfigRecord,
): InquiryConfigRecord | undefined {
  if (!record) return undefined;

  const inqInfo: Partial<INQInfo> = {
    controllerName: record.INQInfo?.controllerName || "",
    description: record.INQInfo?.description || "",
    inqServicePath: record.INQInfo?.inqServicePath || "default",
    inqType: record.INQInfo?.inqType || "DFT",
    pageOrientation: record.INQInfo?.pageOrientation || "Portrait",
    perpageItem: record.INQInfo?.perpageItem || "30",
  };

  if (record.INQInfo?.showSerial) inqInfo.showSerial = true;
  if (record.INQInfo?.showPagination) inqInfo.showPagination = true;
  if (record.INQInfo?.showBranchWise) inqInfo.showBranchWise = true;
  if (record.INQInfo?.fixedSelection?.trim()) {
    inqInfo.fixedSelection = record.INQInfo.fixedSelection.trim();
  }
  if (record.INQInfo?.rptControllerName?.trim()) {
    inqInfo.rptControllerName = record.INQInfo.rptControllerName.trim();
  }
  if (record.INQInfo?.cmdFromInternal) inqInfo.cmdFromInternal = true;
  if (record.INQInfo?.cmdFieldName?.trim()) {
    inqInfo.cmdFieldName = record.INQInfo.cmdFieldName.trim();
  }

  const result: Partial<InquiryConfigRecord> = {
    INQInfo: inqInfo as INQInfo,
    INQSelectField: (record.INQSelectField || []).map(sanitizeInqSelectField),
    INQDef: (record.INQDef || []).map(sanitizeInqDef),
    INQCmds: (record.INQCmds || []).map((cmd) => ({
      cmdButton: cmd.cmdButton,
      cmdFor: cmd.cmdFor,
    })),
  };

  if (record.auditData) result.auditData = record.auditData;
  return result as InquiryConfigRecord;
}
