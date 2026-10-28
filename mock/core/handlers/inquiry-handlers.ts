import "server-only";

import type { CbsWirePayload } from "@/lib/data-schemas";
import { type ApiResponse, CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

/**
 * Accessor retrieving explicit inquiry configuration from database table.
 * If the inquiry record does not exist, returns null (no synthetic fallbacks).
 */
export function getMockInquiryPayload(command: string): unknown {
  const clean = command
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();

  const inqTable = resolveTable(CbsControlTable.INQUIRY_CONFIG);
  if (inqTable?.LIVE[clean]) {
    return inqTable.LIVE[clean];
  }

  return null;
}

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
  const targetModel = (
    inqSpec?.INQInfo?.controllerName ||
    inqSpec?.controllerName ||
    cleanKey
  ).trim().toUpperCase();

  const table = resolveTable(targetModel);
  if (!table) {
    return notFoundResult(`Target database table "${targetModel}" not found for inquiry "${cleanKey}"`);
  }

  const records = table.getList();
  return successResult(records, `Inquiry executed successfully against ${targetModel}`);
}
