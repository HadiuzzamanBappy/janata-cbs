import "server-only";

import type { CbsWirePayload } from "@/lib/data-schemas";
import { type ApiResponse, CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";
import { getMockInquiryPayload } from "./inquiry-handlers";

/**
 * Handles GRL (Generic Record List), GCQ (Custom Queries), GMV (Materialized View), and GGL.
 */
export function handleRecordList(payload: CbsWirePayload): ApiResponse {
  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }
  return successResult(table.getList(), `${cmd} record collection loaded`);
}

/**
 * Handles SBI (Search by recordId / wildcard) and RIL (Record ID List).
 */
export function handleSearchById(payload: CbsWirePayload): ApiResponse {
  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }
  const searchPattern = payload.recordId || "";
  return successResult(table.getIdList(searchPattern), `${cmd} ID list loaded`);
}

/**
 * Handles S / SEE / GET / GRV (Read / View Single Record in View Mode).
 */
export function handleSeeRecord(payload: CbsWirePayload): ApiResponse {
  const recId = (payload.recordId || "").trim();
  if (!recId) {
    return notFoundResult("Missing recordId for SEE / View request");
  }

  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }

  const upperId = recId.toUpperCase();
  const hasVersion = upperId.includes(",");
  const compositeKey = hasVersion
    ? `${upperId.split(",")[0].trim()},${upperId.split(",")[1].trim()}`
    : "";

  // Direct, clean key resolution: exact key, uppercase key, composite key, or prefix-prepended key
  const rawRecord =
    table.LIVE[recId] ||
    table.LIVE[upperId] ||
    (compositeKey ? table.LIVE[compositeKey] : undefined) ||
    (table.prefix ? table.LIVE[`${table.prefix}${upperId}`] : undefined);

  if (!rawRecord) {
    // If querying INQUIRY table for a model without custom inquiry, synthesize raw schema dynamically
    const inqTable = resolveTable(CbsControlTable.INQUIRY_CONFIG);
    const isInquiryTable =
      cmd === CbsControlTable.INQUIRY_CONFIG ||
      inqTable?.name === cmd ||
      inqTable?.physicalName === table.physicalName;

    if (isInquiryTable) {
      const fallbackInquiry = getMockInquiryPayload(recId);
      if (fallbackInquiry) {
        return successResult(fallbackInquiry, `Synthesized raw model inquiry for ${recId}`);
      }
    }

    return notFoundResult(`Record #${recId} not found in database table ${cmd}`);
  }

  const resolvedId = (rawRecord.recordId || rawRecord.id || recId) as string;
  const hasComma = recId.includes(",");
  const targetModel =
    rawRecord.targetModel ||
    rawRecord.controllerName ||
    (hasComma ? recId.split(",")[0].trim() : undefined);
  const version = rawRecord.version || (hasComma ? recId.split(",")[1]?.trim() : undefined);

  const recordWithId = {
    recordId: resolvedId,
    id: resolvedId,
    ...(targetModel ? { targetModel } : {}),
    ...(version ? { version } : {}),
    ...rawRecord,
  };

  return successResult(recordWithId, `${cmd} record loaded`);
}
