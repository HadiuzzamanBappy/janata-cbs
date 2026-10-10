import "server-only";

import {
  STATIC_BRANCH_RESPONSE,
  STATIC_CONTROL_RESPONSE,
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

/**
 * Universal Offline / Static Mock Data Provider.
 *
 * Serves as the single isolated boundary in the codebase where demo/mock data enters.
 * When migrating to pure production without fixtures, only this file needs to be modified or toggled.
 */

export function getStaticUserResponse(username: string): GrpcResponse | null {
  const normalized = username.trim().toLowerCase();
  const matchedKey = Object.keys(STATIC_USER_RESPONSES).find((k) => k.toLowerCase() === normalized);
  return matchedKey ? STATIC_USER_RESPONSES[matchedKey] : null;
}

export function getStaticMenuPayload(): unknown {
  return STATIC_MENU.data;
}

export function getStaticFormPayload(command: string): unknown {
  const cleanCmd = command.trim().toUpperCase();
  return STATIC_FORMS[cleanCmd]?.data ?? null;
}

export function getStaticInquiryPayload(command: string): unknown {
  const cleanCmd = command.trim().toUpperCase();
  return STATIC_INQUIRIES[cleanCmd]?.data ?? null;
}

export function getStaticBranchesPayload(): unknown {
  return STATIC_BRANCH_RESPONSE.data;
}

export function getStaticControlsPayload(): unknown {
  return STATIC_CONTROL_RESPONSE.data;
}

export interface StaticProxyResult {
  status: string;
  statusCode: number;
  message: string;
  data: unknown;
  timestamp: string;
}

/**
 * Handles offline static CRUD and inquiry responses for the /api/proxy endpoint.
 */
export function getStaticProxyResponse(
  requestType: string,
  controlName?: string,
  recordId?: string,
): StaticProxyResult {
  const rawControl = (controlName || "").trim().toUpperCase();
  const cleanModel =
    rawControl === "MENU.TREE" ||
    rawControl === "MENU_TREE" ||
    rawControl === "MENU.DESIGN" ||
    rawControl === "MENU_DESIGN"
      ? STATIC_FORM_DATA.MENU_DESIGN
        ? "MENU_DESIGN"
        : "MENU_TREE"
      : rawControl === "USER.GROUP" || rawControl === "USER_GROUP"
        ? STATIC_FORM_DATA["USER.GROUP"]
          ? "USER.GROUP"
          : "USER_GROUP"
        : rawControl;

  const cleanRecordId = (recordId || "").trim().toUpperCase();
  const now = new Date().toISOString();

  // 1. Inquiry Requests (INQ)
  if (requestType === "INQ") {
    let rawInquiry = STATIC_INQUIRY_DATA[cleanModel] || STATIC_INQUIRY_DATA[cleanRecordId];

    if (!rawInquiry && cleanModel) {
      for (const [inqKey, inqSpec] of Object.entries(STATIC_INQUIRIES)) {
        const fields = inqSpec.data?.fields as Record<string, unknown> | undefined;
        const inqInfo = fields?.INQInfo as
          | { struct_value?: { fields?: Record<string, { string_value?: string }> } }
          | undefined;
        const controller = inqInfo?.struct_value?.fields?.controllerName?.string_value
          ?.trim()
          .toUpperCase();

        if (controller === cleanModel && STATIC_INQUIRY_DATA[inqKey]) {
          rawInquiry = STATIC_INQUIRY_DATA[inqKey];
          break;
        }
      }
    }

    if (rawInquiry) {
      const records = parseInquiryRecords(rawInquiry);
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Inquiry data loaded from offline fixture",
        data: records,
        timestamp: now,
      };
    }

    return {
      status: "SUCCESS",
      statusCode: 200,
      message: "No inquiry records found in fixture",
      data: [],
      timestamp: now,
    };
  }

  // 2. Model Config / Data Dictionary Table Requests (MODEL.CONFIG / SC_MODEL_DEFINITION)
  if (cleanModel === "MODEL.CONFIG") {
    if (!cleanRecordId || cleanRecordId === "LIST" || cleanRecordId === "ALL") {
      const list = Object.values(STATIC_MODEL_CONFIGS).map((record) => ({
        id: record.recordId,
        label: `${record.description} (${record.tableName})`,
        details: `${record.properties.length} columns defined • ${record.category}`,
        record,
      }));
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Model config catalog loaded from fixture",
        data: list,
        timestamp: now,
      };
    }

    if (STATIC_MODEL_CONFIGS[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: `Model config for #${cleanRecordId} loaded from fixture`,
        data: STATIC_MODEL_CONFIGS[cleanRecordId],
        timestamp: now,
      };
    }
  }

  // 3. Form Record & Control Table Requests
  const modelTable = STATIC_FORM_DATA[cleanModel];
  if (modelTable) {
    if (requestType === "RECORD_LIST" || (!recordId && !cleanRecordId)) {
      const list =
        modelTable.enquiryRows && modelTable.enquiryRows.length > 0
          ? modelTable.enquiryRows
          : Object.values(modelTable.records || {});

      return {
        status: "SUCCESS",
        statusCode: 200,
        message: `${cleanModel} catalog list loaded from fixture`,
        data: list,
        timestamp: now,
      };
    }

    const requestedId = (recordId || cleanRecordId || "").trim();
    if (requestedId) {
      if (modelTable.records?.[requestedId]) {
        return {
          status: "SUCCESS",
          statusCode: 200,
          message: "Record loaded from offline fixture",
          data: modelTable.records[requestedId],
          timestamp: now,
        };
      }

      return {
        status: "RECORD_NOT_FOUND",
        statusCode: 404,
        message: `Record #${requestedId} not found in ${cleanModel} fixture`,
        data: null,
        timestamp: now,
      };
    }
  }

  return {
    status: "RECORD_NOT_FOUND",
    statusCode: 200,
    message: `Record #${recordId || ""} not found in offline fixture.`,
    data: null,
    timestamp: now,
  };
}
