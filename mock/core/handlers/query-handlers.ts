import "server-only";

import type { ApiResponse, CbsWirePayload } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

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

  const isAuthOrPending =
    payload.recordFunction === CbsRecordFunction.AUTHORIZE || payload.recordFunction === "A";

  const inauBucket = table.table?.INAU as Record<string, Record<string, unknown>> | undefined;
  const liveBucket = table.LIVE;

  const resolveFromBucket = (bucket?: Record<string, Record<string, unknown>>) => {
    if (!bucket) return undefined;
    return (
      bucket[recId] ||
      bucket[upperId] ||
      (compositeKey ? bucket[compositeKey] : undefined) ||
      (table.prefix ? bucket[`${table.prefix}${upperId}`] : undefined)
    );
  };

  // When authorising (A) or reading pending draft, check INAU first; otherwise check LIVE first with INAU fallback
  const primaryBucket = isAuthOrPending && inauBucket ? inauBucket : liveBucket;
  const secondaryBucket = isAuthOrPending ? liveBucket : inauBucket;

  const rawRecord = resolveFromBucket(primaryBucket) || resolveFromBucket(secondaryBucket);

  if (!rawRecord) {
    return notFoundResult(`Record #${recId} not found in database table ${cmd}`);
  }

  const resolvedId = (rawRecord.recordId || rawRecord.id || recId) as string;
  const hasComma = recId.includes(",");
  const targetModel =
    rawRecord.targetModel ||
    rawRecord.controllerName ||
    (hasComma ? recId.split(",")[0].trim() : undefined);
  const version = rawRecord.version || (hasComma ? recId.split(",")[1]?.trim() : undefined);

  const audit = rawRecord.auditData as Record<string, unknown> | undefined;
  const recordStatus =
    rawRecord.RECORD_STATUS ||
    rawRecord.status ||
    (audit?.recStatus === "AU" ? "AU" : audit?.recStatus) ||
    (isAuthOrPending ? "UA" : "AU");

  const recordWithId = {
    recordId: resolvedId,
    id: resolvedId,
    RECORD_STATUS: recordStatus,
    ...(targetModel ? { targetModel } : {}),
    ...(version ? { version } : {}),
    ...rawRecord,
  };

  return successResult(recordWithId, `${cmd} record loaded`);
}
