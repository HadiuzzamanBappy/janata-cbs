import { z } from "zod";
import {
  type EnquiryRow,
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas/inquiry-config-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

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
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  if (!target || typeof target !== "object") {
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
  const parseResult = z.array(inquiryConfigRecordSchema).safeParse(rawList);

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
