import { z } from "zod";
import { type MenuTreeRecord, menuTreeRecordSchema } from "@/lib/data-schemas/menu-designer-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/**
 * Parses inbound JSON payload into a strictly validated MenuTreeRecord.
 * With clean 1:1 database storage, this executes direct schema validation without manual field mapping.
 */
export function parseMenuTreeRecord(
  rawPayload: unknown,
): { success: true; data: MenuTreeRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Menu tree payload is invalid" };
  }

  // Normalize Protobuf / struct values with decodeProtobufValue
  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);

  // If wrapped in an array or a { records: [...] } envelope, pick the first item
  const list = unwrapRecordsPayload(decoded);
  const target = list.length > 0 ? list[0] : Array.isArray(decoded) ? decoded[0] : decoded;

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

/**
 * Parses a list of menu tree records from CBS backend wire responses.
 */
export function parseMenuTreeList(
  rawPayload: unknown,
): { success: true; data: MenuTreeRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const unwrapped = unwrapRecordsPayload(rawPayload);
  const rawList = Array.isArray(unwrapped)
    ? unwrapped
    : typeof rawPayload === "object" && "records" in (rawPayload as Record<string, unknown>)
      ? (rawPayload as { records: unknown[] }).records
      : [];

  if (!Array.isArray(rawList)) {
    return { success: false, error: "Menu tree list payload is not an array" };
  }

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

/**
 * Serializes internal MenuTreeRecord for database storage or JSON preview.
 * Direct 1:1 canonical format. Safely handles in-progress draft models by falling back
 * gracefully instead of throwing runtime exceptions during live typing.
 */
export function serializeMenuTreeToWireJson(record: MenuTreeRecord): MenuTreeRecord {
  const result = menuTreeRecordSchema.safeParse(record);
  if (result.success) {
    return result.data;
  }
  // During live editing, return raw draft record sanitized for live preview
  return record;
}
