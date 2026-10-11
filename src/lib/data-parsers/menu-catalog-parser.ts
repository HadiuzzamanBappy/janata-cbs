import { z } from "zod";
import {
  type MenuCatalogRecord,
  menuCatalogRecordSchema,
} from "@/lib/data-schemas/menu-catalog-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Single Record Parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound JSON payload into a strictly validated MenuCatalogRecord.
 */
export function parseMenuCatalogRecord(
  rawPayload: unknown,
): { success: true; data: MenuCatalogRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Menu catalog record payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload(decoded);
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  const parseResult = menuCatalogRecordSchema.safeParse(target);
  if (!parseResult.success) {
    return {
      success: false,
      error: `MenuCatalog validation failed: ${parseResult.error.message}`,
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
 * Parses a list of menu catalog records from CBS backend wire responses.
 */
export function parseMenuCatalogList(
  rawPayload: unknown,
): { success: true; data: MenuCatalogRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawList = unwrapRecordsPayload(rawPayload);
  const parseResult = z.array(menuCatalogRecordSchema).safeParse(rawList);

  if (!parseResult.success) {
    return {
      success: false,
      error: `Menu catalog list validation failed: ${parseResult.error.message}`,
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
 * Serializes internal MenuCatalogRecord for database storage or JSON preview.
 */
export function serializeMenuCatalogToWireJson(record: MenuCatalogRecord): MenuCatalogRecord {
  const result = menuCatalogRecordSchema.safeParse(record);
  return result.success ? result.data : record;
}
