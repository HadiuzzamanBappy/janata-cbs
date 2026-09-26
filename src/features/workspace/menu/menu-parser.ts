import { z } from "zod";
import { type MenuItem, menuItemSchema, type RawMenuRecord, rawMenuRecordSchema } from "./schemas";

function toMenuItemNode(record: RawMenuRecord, index: number, parentId = "m"): MenuItem {
  const id = String(record.id ?? record.menuId ?? record.code ?? `${parentId}-${index}`);
  const childrenRecords = record.children ?? record.items;
  const command = record.command ?? record.application;
  const menuId = Number(record.menuId ?? 0);

  const hasChildren = Array.isArray(childrenRecords) && childrenRecords.length > 0;

  return {
    id,
    menuId,
    label: record.label ?? record.description ?? record.menuName ?? id,
    command: hasChildren ? undefined : command?.toUpperCase(),
    children: hasChildren
      ? childrenRecords.map((child, i) => toMenuItemNode(child, i, id))
      : undefined,
  };
}

export function parseMNU(
  rawPayload: unknown,
): { success: true; data: MenuItem[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawArray = Array.isArray(rawPayload)
    ? rawPayload
    : typeof rawPayload === "object" && rawPayload !== null && "menu" in rawPayload
      ? (rawPayload as { menu: unknown }).menu
      : [rawPayload];

  if (!Array.isArray(rawArray)) {
    return {
      success: false,
      error: "MNU payload does not contain a valid array of menu records",
    };
  }

  const arrayResult = z.array(rawMenuRecordSchema).safeParse(rawArray);
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
