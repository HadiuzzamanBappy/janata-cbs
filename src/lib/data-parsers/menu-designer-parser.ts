import { z } from "zod";
import { type MenuTreeRecord, menuTreeRecordSchema } from "@/lib/data-schemas/menu-designer-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Single Record Parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound JSON payload into a strictly validated MenuTreeRecord.
 */
export function parseMenuTreeRecord(
  rawPayload: unknown,
): { success: true; data: MenuTreeRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Menu tree payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload(decoded);
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  const parseResult = menuTreeRecordSchema.safeParse(target);
  if (!parseResult.success) {
    return {
      success: false,
      error: `MenuTree validation failed: ${parseResult.error.message}`,
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
 * Parses a list of menu tree records from CBS backend wire responses.
 */
export function parseMenuTreeList(
  rawPayload: unknown,
): { success: true; data: MenuTreeRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawList = unwrapRecordsPayload(rawPayload);
  const parseResult = z.array(menuTreeRecordSchema).safeParse(rawList);

  if (!parseResult.success) {
    return {
      success: false,
      error: `Menu tree list validation failed: ${parseResult.error.message}`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* Wire Serializer                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Serializes internal MenuTreeRecord for database storage or JSON preview.
 */
export function serializeMenuTreeToWireJson(record: MenuTreeRecord): MenuTreeRecord {
  const result = menuTreeRecordSchema.safeParse(record);
  return result.success ? result.data : record;
}
