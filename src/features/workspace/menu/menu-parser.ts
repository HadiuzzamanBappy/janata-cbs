import { z } from "zod";
import {
  type MenuItem,
  menuItemSchema,
  type RawMenuRecord,
  rawMenuRecordSchema,
} from "./menu-schema";

function extractRawNode(node: unknown): RawMenuRecord {
  if (!node || typeof node !== "object") return {};
  const obj = node as Record<string, unknown>;

  // Check if wrapped in Protobuf struct_value / fields
  const structVal = (obj.struct_value || obj) as Record<string, unknown>;
  const fields = (structVal.fields || structVal) as Record<string, unknown>;

  const getValue = (val: unknown): unknown => {
    if (typeof val === "object" && val !== null) {
      const v = val as Record<string, unknown>;
      if ("string_value" in v) return v.string_value;
      if ("number_value" in v) return v.number_value;
      if ("bool_value" in v) return v.bool_value;
      if ("list_value" in v && typeof v.list_value === "object" && v.list_value !== null) {
        const lv = v.list_value as Record<string, unknown>;
        if (Array.isArray(lv.values)) {
          return lv.values.map(extractRawNode);
        }
      }
      if ("struct_value" in v) return extractRawNode(v);
    }
    return val;
  };

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = getValue(v);
  }

  // Handle direct children if already array
  if (Array.isArray(obj.children)) {
    result.children = obj.children.map(extractRawNode);
  }

  return result as RawMenuRecord;
}

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
    command: hasChildren ? undefined : command ? String(command).toUpperCase() : undefined,
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

  let rawList: unknown[] = [];

  if (Array.isArray(rawPayload)) {
    rawList = rawPayload;
  } else if (typeof rawPayload === "object" && rawPayload !== null) {
    const obj = rawPayload as Record<string, unknown>;
    const fields = (obj.fields || obj) as Record<string, unknown>;
    const records = (fields.records || fields.menu) as Record<string, unknown> | undefined;
    const listValue = records?.list_value as Record<string, unknown> | undefined;
    if (Array.isArray(listValue?.values)) {
      rawList = listValue.values;
    } else if (Array.isArray(obj.records)) {
      rawList = obj.records;
    } else if (Array.isArray(obj.items)) {
      rawList = obj.items;
    } else if (Array.isArray(obj.menu)) {
      rawList = obj.menu;
    } else {
      rawList = [rawPayload];
    }
  }

  if (!Array.isArray(rawList)) {
    return {
      success: false,
      error: "MNU payload does not contain a valid array of menu records",
    };
  }

  const rawRecords = rawList.map(extractRawNode);

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
