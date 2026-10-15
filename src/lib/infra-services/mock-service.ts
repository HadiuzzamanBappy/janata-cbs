import "server-only";

import {
  AC_ACCOUNT_ENQUIRY_ROWS,
  AC_ACCOUNT_LIVE,
  CUST_CUSTOMER_LIVE,
  SC_CONTROL_LIVE,
  STATIC_BRANCH_RESPONSE,
  STATIC_CONTROL_RESPONSE,
  STATIC_FORM_CONFIG_LIST,
  STATIC_FORM_CONFIGS,
  STATIC_INQUIRIES,
  STATIC_MENU,
  STATIC_MODEL_CONFIG_LIST,
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
 * Returns mock transaction form specification payload for a command code from SC_MODEL_CONFIG.
 */
export function getMockFormPayload(command: string): unknown {
  const clean = command.trim().toUpperCase().split(",")[0].trim();
  const model = STATIC_MODEL_CONFIGS[clean];
  if (!model) return null;

  return {
    record: {
      tableName: model.tableName,
      description: model.description,
      prefix: model.prefix,
      idDef: model.idDef,
      properties: model.properties,
      auditData: model.auditData,
    },
  };
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
/* Mock Proxy Dispatcher                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Handles offline static CRUD and inquiry responses for the `/api/proxy` endpoint.
 * Directly reads canonical database tables without legacy dictionary wrappers.
 */
export function getMockProxyResponse(
  requestType: string,
  controlName?: string,
  recordId?: string,
): MockProxyResult {
  const cleanModel = (controlName || "").trim().toUpperCase();
  const cleanRecordId = (recordId || "").trim().toUpperCase();
  const timestamp = new Date().toISOString();

  // 1. Inquiry Requests (INQ)
  if (requestType === "INQ") {
    // Check canonical inquiry specs
    const inqSpec = STATIC_INQUIRIES[cleanModel] || STATIC_INQUIRIES[cleanRecordId];
    if (inqSpec) {
      const records = parseInquiryRecords(inqSpec);
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Inquiry data loaded from canonical table",
        data: records,
        timestamp,
      };
    }

    if (cleanModel === "ACCOUNT" || cleanRecordId === "ACCOUNT") {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Account inquiry loaded",
        data: AC_ACCOUNT_ENQUIRY_ROWS,
        timestamp,
      };
    }

    return {
      status: "SUCCESS",
      statusCode: 200,
      message: "No inquiry records found in fixture",
      data: [],
      timestamp,
    };
  }

  // 2. Model Config Metamodel Catalog (SC.MODEL.CONFIG / MODEL.CONFIG)
  if (cleanModel === "SC.MODEL.CONFIG" || cleanModel === "MODEL.CONFIG") {
    if (!cleanRecordId || cleanRecordId === "LIST" || cleanRecordId === "ALL") {
      const data = STATIC_MODEL_CONFIG_LIST.map((record) => ({
        id: record.recordId,
        label: `${record.description} (${record.tableName})`,
        details: `${record.properties.length} columns defined • ${record.category}`,
        record,
      }));
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Model config catalog loaded from canonical table",
        data,
        timestamp,
      };
    }

    if (STATIC_MODEL_CONFIGS[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: `Model config for #${cleanRecordId} loaded`,
        data: STATIC_MODEL_CONFIGS[cleanRecordId],
        timestamp,
      };
    }
  }

  // 3. Form Config Presentation Catalog (SC.FORM.CONFIG / FORM.CONFIG)
  if (cleanModel === "SC.FORM.CONFIG" || cleanModel === "FORM.CONFIG") {
    if (
      !cleanRecordId ||
      cleanRecordId === "LIST" ||
      cleanRecordId === "ALL" ||
      requestType === "GRL" ||
      requestType === "RECORD_LIST"
    ) {
      const data = STATIC_FORM_CONFIG_LIST.map((record) => ({
        id: record.recordId,
        label: `${record.title} (${record.targetModel})`,
        details: `${record.presentation.sections.length} sections • ${record.targetModel}`,
        record,
      }));
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Form config catalog loaded from canonical table",
        data,
        timestamp,
      };
    }

    if (STATIC_FORM_CONFIGS[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: `Form config for #${cleanRecordId} loaded`,
        data: STATIC_FORM_CONFIGS[cleanRecordId],
        timestamp,
      };
    }
  }

  // 4. Core Business Table Direct Reads
  if (cleanModel === "ACCOUNT") {
    if (requestType === "GRL" || requestType === "RECORD_LIST" || (!recordId && !cleanRecordId)) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Account list loaded",
        data: AC_ACCOUNT_ENQUIRY_ROWS,
        timestamp,
      };
    }
    if (cleanRecordId && AC_ACCOUNT_LIVE[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Account record loaded",
        data: AC_ACCOUNT_LIVE[cleanRecordId],
        timestamp,
      };
    }
  }

  if (cleanModel === "CUSTOMER") {
    if (requestType === "GRL" || requestType === "RECORD_LIST" || (!recordId && !cleanRecordId)) {
      const list = Object.values(CUST_CUSTOMER_LIVE).map((c) => ({
        id: c.recordId,
        label: c.fullName as string,
        details: `DOB: ${c.dateOfBirth}`,
        ...c,
      }));
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Customer list loaded",
        data: list,
        timestamp,
      };
    }
    if (cleanRecordId && CUST_CUSTOMER_LIVE[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Customer record loaded",
        data: CUST_CUSTOMER_LIVE[cleanRecordId],
        timestamp,
      };
    }
  }

  if (cleanModel === "CONTROL") {
    if (requestType === "GRL" || requestType === "RECORD_LIST" || (!recordId && !cleanRecordId)) {
      const list = Object.values(SC_CONTROL_LIVE).map((ctl) => ({
        id: ctl.recordId,
        label: ctl.description,
        ...ctl,
      }));
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Control list loaded",
        data: list,
        timestamp,
      };
    }
    if (cleanRecordId && SC_CONTROL_LIVE[cleanRecordId]) {
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Control record loaded",
        data: SC_CONTROL_LIVE[cleanRecordId],
        timestamp,
      };
    }
  }

  return {
    status: "RECORD_NOT_FOUND",
    statusCode: 404,
    message: `Record #${recordId || cleanRecordId || ""} not found in database table ${cleanModel || "UNKNOWN"}.`,
    data: null,
    timestamp,
  };
}
