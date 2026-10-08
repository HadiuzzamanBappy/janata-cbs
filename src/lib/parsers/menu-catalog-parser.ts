import { z } from "zod";
import { unwrapRecordsPayload } from "./protobuf-decoder";
import {
  type MenuCatalogRecord,
  menuCatalogRecordSchema,
} from "@/lib/schemas/menu-catalog-schema";

/**
 * Parses inbound JSON payload into a strictly validated MenuCatalogRecord.
 * With clean 1:1 database storage, this executes direct schema validation without manual field mapping.
 */
export function parseMenuCatalogRecord(
  rawPayload: unknown,
): { success: true; data: MenuCatalogRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Menu catalog record payload is invalid" };
  }

  // Handle possible wrapped gRPC/response payload
  const unwrapped = unwrapRecordsPayload(rawPayload);
  const target = Array.isArray(unwrapped) ? unwrapped[0] : unwrapped;

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

/**
 * Parses a list of menu catalog records from CBS backend wire responses.
 */
export function parseMenuCatalogList(
  rawPayload: unknown,
): { success: true; data: MenuCatalogRecord[] } | { success: false; error: string } {
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
    return { success: false, error: "Menu catalog list payload is not an array" };
  }

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

/**
 * Serializes internal MenuCatalogRecord for database storage or JSON preview.
 * Direct 1:1 canonical format. Safely handles in-progress draft records by falling back
 * gracefully instead of throwing runtime exceptions during live typing.
 */
export function serializeMenuCatalogToWireJson(
  record: MenuCatalogRecord,
): MenuCatalogRecord {
  const result = menuCatalogRecordSchema.safeParse(record);
  if (result.success) {
    return result.data;
  }
  // During live editing (e.g. freshly added draft without label yet),
  // return the raw draft record sanitized for live preview
  return record;
}
