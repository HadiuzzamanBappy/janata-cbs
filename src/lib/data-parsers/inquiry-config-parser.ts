import {
  type INQCmd,
  type INQDef,
  type INQInfo,
  type INQSelectField,
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas";
import { unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Inbound Wire Envelope Normalizer                                           */
/* -------------------------------------------------------------------------- */

function cleanWireString(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  return str !== "" ? str : fallback;
}

function cleanWireBoolean(val: unknown): boolean {
  return val === true || val === "true" || val === "Y" || val === 1 || val === "1";
}

/* -------------------------------------------------------------------------- */
/* Core SN-Keyed Wire Format                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The CBS core may return INQUIRY records keyed by the INQUIRY model's property serial numbers
 * ("1_8", "3_1") instead of property names. Each section's SN prefix and positional field order
 * below mirror the core's INQUIRY model (index i ↔ SN `${prefix}_${i + 1}`).
 */
const INQUIRY_SN_LAYOUT = {
  INQInfo: {
    prefix: "1",
    fields: [
      "description",
      "pageOrientation",
      "perpageItem",
      "showSerial",
      "showPagination",
      "showBranchWise",
      "inqType",
      "controllerName",
      "rptControllerName",
      "fixedSelection",
      "inqServicePath",
      "cmdFromInternal",
      "cmdFieldName",
    ] satisfies (keyof INQInfo)[],
  },
  INQSelectField: {
    prefix: "2",
    fields: [
      "selectFieldName",
      "selectFieldType",
      "selectFieldOperator",
      "selectFieldOperatorFixed",
      "selectFieldDisplay",
      "selectFieldValue",
      "selectFieldRequired",
    ] satisfies (keyof INQSelectField)[],
  },
  INQDef: {
    prefix: "3",
    fields: [
      "fieldName",
      "fieldType",
      "fieldFunc",
      "fieldRowCol",
      "fieldLength",
      "fieldDisplay",
      "dataPassable",
    ] satisfies (keyof INQDef)[],
  },
  INQCmds: {
    prefix: "4",
    fields: ["cmdFor", "cmdButton"] satisfies (keyof INQCmd)[],
  },
} as const;

type InquirySnSection = keyof typeof INQUIRY_SN_LAYOUT;

/** Resolves SN-keyed properties to canonical names; named keys always take precedence. */
function resolveSnKeys(raw: unknown, section: InquirySnSection): Record<string, unknown> {
  const rec = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const { prefix, fields } = INQUIRY_SN_LAYOUT[section];
  const resolved: Record<string, unknown> = { ...rec };

  fields.forEach((name, idx) => {
    const snKey = `${prefix}_${idx + 1}`;
    if (resolved[name] === undefined && snKey in rec) {
      resolved[name] = rec[snKey];
    }
    delete resolved[snKey];
  });

  return resolved;
}

function normalizeInquiryTarget(target: unknown): Record<string, unknown> | null {
  if (!target || typeof target !== "object") return null;

  let rec = target as Record<string, unknown>;

  if (rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)) {
    rec = rec.data as Record<string, unknown>;
  }
  if (rec.record && typeof rec.record === "object" && !Array.isArray(rec.record)) {
    rec = rec.record as Record<string, unknown>;
  }

  const rawInfo = resolveSnKeys(
    rec.INQInfo && typeof rec.INQInfo === "object" ? rec.INQInfo : rec,
    "INQInfo",
  );

  const inqInfo: Record<string, unknown> = {
    controllerName: cleanWireString(rawInfo.controllerName),
    description: cleanWireString(rawInfo.description),
    pageOrientation:
      String(rawInfo.pageOrientation).trim() === "Landscape" ? "Landscape" : "Portrait",
    perpageItem: cleanWireString(rawInfo.perpageItem, "30"),
    showSerial: cleanWireBoolean(rawInfo.showSerial),
    showPagination: cleanWireBoolean(rawInfo.showPagination),
    showBranchWise: cleanWireBoolean(rawInfo.showBranchWise),
    inqType: cleanWireString(rawInfo.inqType, "DFT"),
    rptControllerName: cleanWireString(rawInfo.rptControllerName),
    fixedSelection: cleanWireString(rawInfo.fixedSelection),
    inqServicePath: cleanWireString(rawInfo.inqServicePath, "default"),
    cmdFromInternal: cleanWireBoolean(rawInfo.cmdFromInternal),
    cmdFieldName: cleanWireString(rawInfo.cmdFieldName),
  };

  const rawSelectFields = Array.isArray(rec.INQSelectField) ? rec.INQSelectField : [];
  const inqSelectField = rawSelectFields.map((f: unknown) => {
    const rawF = resolveSnKeys(f, "INQSelectField");
    const rawType = cleanWireString(rawF.selectFieldType, "text").toLowerCase();
    const cleanType = ["text", "number", "date", "select"].includes(rawType) ? rawType : "text";
    return {
      selectFieldName: cleanWireString(rawF.selectFieldName),
      selectFieldDisplay:
        cleanWireString(rawF.selectFieldDisplay) || cleanWireString(rawF.selectFieldName),
      selectFieldType: cleanType,
      selectFieldOperator: cleanWireString(rawF.selectFieldOperator, "EQ").toUpperCase(),
      selectFieldOperatorFixed: cleanWireString(rawF.selectFieldOperatorFixed),
      selectFieldValue: cleanWireString(rawF.selectFieldValue),
      selectFieldRequired: cleanWireBoolean(rawF.selectFieldRequired),
    };
  });

  const rawDefs = Array.isArray(rec.INQDef) ? rec.INQDef : [];
  const inqDef = rawDefs.map((col: unknown) => {
    const rawCol = resolveSnKeys(col, "INQDef");
    return {
      fieldName: cleanWireString(rawCol.fieldName),
      fieldDisplay: cleanWireString(rawCol.fieldDisplay) || cleanWireString(rawCol.fieldName),
      fieldType: cleanWireString(rawCol.fieldType, "DC"),
      fieldFunc: cleanWireString(rawCol.fieldFunc),
      fieldRowCol: cleanWireString(rawCol.fieldRowCol, "1,1"),
      fieldLength: cleanWireString(rawCol.fieldLength, "20,L"),
      dataPassable: cleanWireBoolean(rawCol.dataPassable),
    };
  });

  const rawCmds = Array.isArray(rec.INQCmds) ? rec.INQCmds : [];
  const inqCmds = rawCmds.map((cmd: unknown) => {
    const rawCmd = resolveSnKeys(cmd, "INQCmds");
    return {
      cmdFor: cleanWireString(rawCmd.cmdFor),
      cmdButton: cleanWireString(rawCmd.cmdButton),
    };
  });

  return {
    ...rec,
    INQInfo: inqInfo,
    INQSelectField: inqSelectField,
    INQDef: inqDef,
    INQCmds: inqCmds,
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

  const list = unwrapRecordsPayload<Record<string, unknown>>(rawPayload);
  const target = normalizeInquiryTarget(
    list[0] ?? (Array.isArray(rawPayload) ? rawPayload[0] : rawPayload),
  );

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
