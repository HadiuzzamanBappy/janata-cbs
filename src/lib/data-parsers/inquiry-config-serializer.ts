import type { INQDef, INQInfo, INQSelectField, InquiryConfigRecord } from "@/lib/data-schemas";

/* -------------------------------------------------------------------------- */
/* Outbound Database Serializers & Query Sanitizers                           */
/* -------------------------------------------------------------------------- */

function sanitizeInqSelectField(f: INQSelectField): INQSelectField {
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

function sanitizeInqDef(col: INQDef): INQDef {
  return {
    fieldName: col.fieldName?.trim() || "",
    fieldDisplay: col.fieldDisplay?.trim() || col.fieldName?.trim() || "",
    fieldType: col.fieldType?.trim() || "DC",
    fieldFunc: col.fieldFunc?.trim() || "",
    fieldRowCol: col.fieldRowCol?.trim() || "1,1",
    fieldLength: col.fieldLength?.trim() || "20,L",
    dataPassable: Boolean(col.dataPassable),
  };
}

/**
 * Produces a clean, normalized InquiryConfigRecord aligned 1:1 with the canonical schema.
 */
export function sanitizeInquiryConfigRecord(record: InquiryConfigRecord): InquiryConfigRecord {
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
