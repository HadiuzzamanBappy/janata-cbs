import { z } from "zod";
import {
  type MenuItem,
  menuItemSchema,
  type RawMenuRecord,
  rawMenuRecordSchema,
} from "@/lib/data-schemas";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Domain Node Transformation Helper                                          */
/* -------------------------------------------------------------------------- */

function toMenuItemNode(record: RawMenuRecord, index: number, parentId = "m"): MenuItem {
  const id = String(record.id ?? record.menuId ?? record.code ?? `${parentId}-${index}`);
  const childrenRecords = record.children ?? record.items;
  const command = record.command ?? record.application;
  const parsedMenuId = Number(record.menuId ?? 0);
  const menuId = Number.isNaN(parsedMenuId) ? 0 : parsedMenuId;

  const hasChildren = Array.isArray(childrenRecords) && childrenRecords.length > 0;

  return {
    id,
    menuId,
    label: record.label ?? record.description ?? record.menuName ?? id,
    command: hasChildren ? undefined : command ? String(command).toUpperCase() : undefined,
    children: hasChildren
      ? childrenRecords.map((child, i) => toMenuItemNode(child, i, id))
      : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Canonical Menu Wire Payload Parser                                         */
/* -------------------------------------------------------------------------- */

/**
 * Standard parser to transform raw CBS menu payload into a validated MenuItem hierarchy.
 */
export function parseMNU(
  rawPayload: unknown,
): { success: true; data: MenuItem[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawList = unwrapRecordsPayload(rawPayload);
  const rawRecords = rawList.map((item) => decodeProtobufValue<RawMenuRecord>(item));

  const arrayResult = z.array(rawMenuRecordSchema).safeParse(rawRecords);
  if (!arrayResult.success) {
    return {
      success: false,
      error: `Menu Zod validation error: ${arrayResult.error.message}`,
    };
  }

  const parsedItems: MenuItem[] = arrayResult.data.map((rec, idx) => toMenuItemNode(rec, idx));

  const finalCheck = z.array(menuItemSchema).safeParse(parsedItems);
  if (!finalCheck.success) {
    return {
      success: false,
      error: `MenuItem validation failed: ${finalCheck.error.message}`,
    };
  }

  return {
    success: true,
    data: finalCheck.data,
  };
}
