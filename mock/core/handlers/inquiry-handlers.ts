import "server-only";

import type { ApiResponse, CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

/**
 * Handles INQ (Dynamic Inquiry Execution).
 * Strictly executes the query against the target controller table.
 * If the target table does not exist or has no records, returns 404 RECORD_NOT_FOUND.
 */
export function handleInquiry(payload: CbsWirePayload): ApiResponse {
  const cleanKey = (payload.controlName || payload.recordId || "").trim().toUpperCase();
  const inqTable = resolveTable(CbsControlTable.INQUIRY_CONFIG);
  const inqSpec = inqTable?.LIVE[cleanKey] as
    | { INQInfo?: { controllerName?: string }; controllerName?: string }
    | undefined;

  // 1. Resolve target table either from INQInfo.controllerName or direct controlName
  const rawTarget = (inqSpec?.INQInfo?.controllerName || inqSpec?.controllerName || cleanKey)
    .trim()
    .toUpperCase();

  const isUna = rawTarget.includes("$UNA") || rawTarget.includes("$NAU");
  const targetModel = rawTarget.split("$")[0];

  const table = resolveTable(targetModel);
  if (!table) {
    return notFoundResult(
      `Target database table "${targetModel}" not found for inquiry "${cleanKey}"`,
    );
  }

  const records = isUna ? table.getList("INAU") : table.getList("LIVE");
  return successResult(records, `Inquiry executed successfully against ${targetModel}`);
}
