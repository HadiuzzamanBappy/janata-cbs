import "server-only";

import {
  STATIC_BRANCH_RESPONSE,
  STATIC_CONTROL_RESPONSE,
  STATIC_FORM_CONFIGS,
  STATIC_FORM_DATA,
  STATIC_FORMS,
  STATIC_INQUIRIES,
  STATIC_INQUIRY_DATA,
  STATIC_MENU,
  STATIC_MODEL_CONFIGS,
  STATIC_USER_RESPONSES,
} from "@fixtures";
import { parseInquiryRecords } from "@/lib/data-parsers";
import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                         */
/* -------------------------------------------------------------------------- */

export interface MockProxyResult {
  status: string;
  statusCode: number;
  message: string;
  data: unknown;
  timestamp: string;
}

/* -------------------------------------------------------------------------- */
/* Universal Offline / Mock Data Service                                      */
/* -------------------------------------------------------------------------- */

/**
 * Returns mock authentication response for the given username.
 */
export function getMockUserResponse(username: string): GrpcResponse | null {
  const normalized = username.trim().toLowerCase();
  const matchedKey = Object.keys(STATIC_USER_RESPONSES).find((k) => k.toLowerCase() === normalized);
  return matchedKey ? STATIC_USER_RESPONSES[matchedKey] : null;
}

/**
 * Returns mock menu wire payload for application navigation.
 */
export function getMockMenuPayload(): unknown {
  return STATIC_MENU.data;
}

/**
 * Returns mock transaction form specification payload for a command code.
 * Checks exact version (e.g. "USER.MGT,NEW1") first, then falls back to base model ("USER.MGT").
 */
export function getMockFormPayload(command: string): unknown {
  const clean = command.trim().toUpperCase();
  if (STATIC_FORMS[clean]?.data) {
    return STATIC_FORMS[clean].data;
  }
  const base = clean.split(",")[0].trim();
  return STATIC_FORMS[base]?.data ?? null;
}

/**
 * Returns mock enquiry grid specification payload for a command code.
 */
export function getMockInquiryPayload(command: string): unknown {
  return STATIC_INQUIRIES[command.trim().toUpperCase()]?.data ?? null;
}

/**
 * Returns mock branch directory wire payload.
 */
export function getMockBranchesPayload(): unknown {
  return STATIC_BRANCH_RESPONSE.data;
}

/**
 * Returns mock system control commands wire payload.
 */
export function getMockControlsPayload(): unknown {
  return STATIC_CONTROL_RESPONSE.data;
}

/* -------------------------------------------------------------------------- */
/* Internal Mock Proxy Resolution Helpers                                     */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes legacy or aliased control table names to their fixture keys.
 */
function resolveMockModelName(rawControl?: string): string {
  const key = (rawControl || "").trim().toUpperCase();
  if (
    key === "MENU.TREE" ||
    key === "MENU_TREE" ||
    key === "MENU.DESIGN" ||
    key === "MENU_DESIGN"
  ) {
    return STATIC_FORM_DATA.MENU_DESIGN ? "MENU_DESIGN" : "MENU_TREE";
  }
  if (key === "USER.GROUP" || key === "USER_GROUP") {
    return STATIC_FORM_DATA["USER.GROUP"] ? "USER.GROUP" : "USER_GROUP";
  }
  return key;
}

/**
 * Finds mock inquiry records by model key, record ID, or controller name inside Protobuf specs.
 */
function findMockInquiryRecords(cleanModel: string, cleanRecordId: string): unknown[] | null {
  const directInquiry = STATIC_INQUIRY_DATA[cleanModel] || STATIC_INQUIRY_DATA[cleanRecordId];
  if (directInquiry) return parseInquiryRecords(directInquiry);

  if (!cleanModel) return null;

  for (const [inqKey, inqSpec] of Object.entries(STATIC_INQUIRIES)) {
    const fields = inqSpec.data?.fields as Record<string, unknown> | undefined;
    const inqInfo = fields?.INQInfo as
      | { struct_value?: { fields?: Record<string, { string_value?: string }> } }
      | undefined;
    const controller = inqInfo?.struct_value?.fields?.controllerName?.string_value
      ?.trim()
      .toUpperCase();

    if (controller === cleanModel && STATIC_INQUIRY_DATA[inqKey]) {
      return parseInquiryRecords(STATIC_INQUIRY_DATA[inqKey]);
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Mock Proxy Dispatcher                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Handles offline static CRUD and inquiry responses for the `/api/proxy` endpoint.
 */
export function getMockProxyResponse(
  requestType: string,
  controlName?: string,
  recordId?: string,
): MockProxyResult {
  const cleanModel = resolveMockModelName(controlName);
  const cleanRecordId = (recordId || "").trim().toUpperCase();
  const timestamp = new Date().toISOString();

  // 1. Inquiry Requests (INQ)
  if (requestType === "INQ") {
    const records = findMockInquiryRecords(cleanModel, cleanRecordId);
    return {
      status: "SUCCESS",
      statusCode: 200,
      message: records
        ? "Inquiry data loaded from offline fixture"
        : "No inquiry records found in fixture",
      data: records ?? [],
      timestamp,
    };
  }

  // 2. Model Config / Metamodel Catalog (SC.MODEL.CONFIG)
  if (cleanModel === "SC.MODEL.CONFIG") {
    if (!cleanRecordId || cleanRecordId === "LIST" || cleanRecordId === "ALL") {
      const data = Object.values(STATIC_MODEL_CONFIGS).map((record) => ({
        id: record.recordId,
        label: `${record.description} (${record.tableName})`,
        details: `${record.properties.length} columns defined • ${record.category}`,
        record,
      }));
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Model config catalog loaded from fixture",
        data,
        timestamp,
      };
    }

    if (STATIC_MODEL_CONFIGS[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: `Model config for #${cleanRecordId} loaded from fixture`,
        data: STATIC_MODEL_CONFIGS[cleanRecordId],
        timestamp,
      };
    }
  }

  // 3. Form Config / Presentation Designer Catalog (SC.FORM.CONFIG / FORM.CONFIG)
  if (cleanModel === "SC.FORM.CONFIG" || cleanModel === "FORM.CONFIG") {
    if (
      !cleanRecordId ||
      cleanRecordId === "LIST" ||
      cleanRecordId === "ALL" ||
      requestType === "GRL" ||
      requestType === "RECORD_LIST"
    ) {
      const data = Object.values(STATIC_FORM_CONFIGS).map((record) => ({
        id: record.recordId,
        label: `${record.title} (${record.targetModel})`,
        details: `${record.presentation.sections.length} sections • ${record.targetModel}`,
        record,
      }));
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Form config catalog loaded from fixture",
        data,
        timestamp,
      };
    }

    if (STATIC_FORM_CONFIGS[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: `Form config for #${cleanRecordId} loaded from fixture`,
        data: STATIC_FORM_CONFIGS[cleanRecordId],
        timestamp,
      };
    }
  }

  // 4. Form Record & Control Table Requests
  const modelTable = STATIC_FORM_DATA[cleanModel];
  if (modelTable) {
    if (requestType === "GRL" || requestType === "RECORD_LIST" || (!recordId && !cleanRecordId)) {
      const records = Object.values(modelTable.records || {});
      const data =
        records.length > 0
          ? records.map((rec) => {
              const recId = String(rec.recordId || rec.id || "");
              const label = String(
                rec.employeeName ||
                  rec["ACCOUNT.TITLE"] ||
                  rec.accountTitle1 ||
                  rec.name ||
                  rec.fullName ||
                  recId,
              );
              const details = rec.branchCode ? `Branch: ${rec.branchCode}` : undefined;
              return {
                id: recId,
                label,
                details,
                ...rec,
              };
            })
          : modelTable.enquiryRows && modelTable.enquiryRows.length > 0
            ? modelTable.enquiryRows
            : [];

      return {
        status: "SUCCESS",
        statusCode: 200,
        message: `${cleanModel} catalog list loaded from fixture`,
        data,
        timestamp,
      };
    }

    const requestedId = (recordId || cleanRecordId || "").trim();
    if (requestedId && modelTable.records?.[requestedId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Record loaded from offline fixture",
        data: modelTable.records[requestedId],
        timestamp,
      };
    }
  }

  // Fallback for GRL if table has no explicit records defined: generate sample IDs with prefix
  if (requestType === "GRL") {
    const prefix = cleanModel.replace(/[^A-Z]/g, "").slice(0, 2) || "REC";
    const sampleItems = [
      { id: `${prefix}00001`, label: `${cleanModel} Record 001`, details: "Status: Live" },
      { id: `${prefix}00002`, label: `${cleanModel} Record 002`, details: "Status: Live" },
      { id: `${prefix}00003`, label: `${cleanModel} Record 003`, details: "Status: Pending" },
    ];
    return {
      status: "SUCCESS",
      statusCode: 200,
      message: `${cleanModel} sample record list loaded from mock`,
      data: sampleItems,
      timestamp,
    };
  }

  return {
    status: "RECORD_NOT_FOUND",
    statusCode: 404,
    message: `Record #${recordId || cleanRecordId || ""} not found in offline fixture.`,
    data: null,
    timestamp,
  };
}
