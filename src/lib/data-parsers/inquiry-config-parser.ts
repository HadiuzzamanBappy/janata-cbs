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
/* Helper: Normalize Inbound Wire Envelope                                    */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes any CBS wire payload (wrapped envelope, GMC PROPERTIES format,
 * or canonical flat structure) into an inquiryConfigRecordSchema-compatible shape.
 */
function normalizeInquiryTarget(target: unknown): Record<string, unknown> | null {
  if (!target || typeof target !== "object") return null;

  let rec = target as Record<string, unknown>;

  // 1. Unwrap common response envelopes (e.g. { data: { record: { ... } } })
  if (rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)) {
    rec = rec.data as Record<string, unknown>;
  }
  if (rec.record && typeof rec.record === "object" && !Array.isArray(rec.record)) {
    rec = rec.record as Record<string, unknown>;
  }

  // 2. Handle GMC PROPERTIES array format (when loaded via MODEL.CONFIG / table meta)
  if (Array.isArray(rec.PROPERTIES)) {
    const props = rec.PROPERTIES as Array<{
      NAME?: string;
      VALUE?: unknown;
    }>;

    const findPropValue = (name: string): unknown => {
      const match = props.find((p) => p.NAME?.toUpperCase() === name.toUpperCase());
      return match?.VALUE;
    };

    const rawInqInfoVal = findPropValue("INQInfo");
    const rawInqInfo = Array.isArray(rawInqInfoVal)
      ? (rawInqInfoVal[0] ?? {})
      : (rawInqInfoVal ?? {});

    const rawSelectVal = findPropValue("INQSelectField");
    const rawSelect = Array.isArray(rawSelectVal) ? rawSelectVal : [];

    const rawDefVal = findPropValue("INQDef");
    const rawDef = Array.isArray(rawDefVal) ? rawDefVal : [];

    const rawCmdsVal = findPropValue("INQCmds");
    const rawCmds = Array.isArray(rawCmdsVal) ? rawCmdsVal : [];

    return {
      INQInfo: rawInqInfo,
      INQSelectField: rawSelect,
      INQDef: rawDef,
      INQCmds: rawCmds,
      auditData: rec.auditData ?? rec.auditFields,
    };
  }

  // 3. Handle Canonical Flat / Tabular record format
  const inqInfo = rec.INQInfo ?? {};
  const inqSelect = Array.isArray(rec.INQSelectField) ? rec.INQSelectField : [];
  const inqDef = Array.isArray(rec.INQDef) ? rec.INQDef : [];
  const inqCmds = Array.isArray(rec.INQCmds) ? rec.INQCmds : [];

  return {
    ...rec,
    INQInfo: inqInfo,
    INQSelectField: inqSelect,
    INQDef: inqDef,
    INQCmds: inqCmds,
    auditData: rec.auditData ?? rec.auditFields,
  };
}

/* -------------------------------------------------------------------------- */
/* Single Record Parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound JSON / Protobuf payload into a strictly validated InquiryConfigRecord.
 */
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

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* List Parser                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Parses a list of inquiry config records from CBS backend wire responses.
 */
export function parseInquiryConfigList(
  rawPayload: unknown,
): { success: true; data: InquiryConfigRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

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

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* Dataset Rows Parser                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Parses raw CBS Inquiry dataset wire response into typed flat EnquiryRow[] records.
 */
export function parseInquiryRecords(rawPayload: unknown): EnquiryRow[] {
  if (!rawPayload) return [];

  const records = unwrapRecordsPayload<Record<string, unknown>>(rawPayload);
  return records.map((item, idx) => {
    const id = String(item.id || item.recordId || item.txnReference || item.accountNumber || idx);
    return { id, ...item };
  });
}

/* -------------------------------------------------------------------------- */
/* Sanitizers & Wire Serializers                                              */
/* -------------------------------------------------------------------------- */

/**
 * Sanitizes an INQSelectField for sparse persistence:
 * - Omits empty prefill values
 * - Omits default false flags (selectFieldRequired: false)
 * - Omits empty fixed operator locks
 */
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

/**
 * Sanitizes an INQDef column definition:
 * - Omits empty routines
 * - Omits falsy/null passable flags
 */
export function sanitizeInqDef(col: INQDef): INQDef {
  const result: Partial<INQDef> = {
    fieldName: col.fieldName,
    fieldDisplay: col.fieldDisplay || col.fieldName,
    fieldType: col.fieldType || "CH",
    fieldLength: col.fieldLength || "20,L",
    fieldRowCol: col.fieldRowCol || "1,1",
  };
  if (col.fieldFunc?.trim()) result.fieldFunc = col.fieldFunc.trim();
  if (col.dataPassable) result.dataPassable = true;
  return result as INQDef;
}

/**
 * Sanitizes an InquiryConfigRecord for database persistence & wire JSON:
 * - Strips empty string overrides from INQInfo
 * - Cleans selection criteria and table columns arrays
 * - Preserves audit context
 */
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
