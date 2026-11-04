import { z } from "zod";
import {
  type MenuCatalogRecord,
  type MenuItem,
  type MenuTreeRecord,
  menuCatalogRecordSchema,
  menuTreeRecordSchema,
} from "@/lib/data-schemas/menu-designer-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* ========================================================================== */
/* 0. NAVIGATION MENU TREE PARSER (GUM / Sidebar Navigation)                  */
/* ========================================================================== */

interface RawMenuNode {
  id?: string | number;
  menuId?: string | number;
  label?: string;
  command?: string;
  menuType?: "SCREEN" | "POPUP";
  children?: RawMenuNode[];
  items?: RawMenuNode[];
  [key: string]: unknown;
}

function normalizeNode(raw: RawMenuNode, idx: number, parentKey = "m"): MenuItem {
  const id = String(raw.id ?? raw.menuId ?? `${parentKey}-${idx}`);
  const rawChildren = raw.children ?? raw.items;
  const children =
    Array.isArray(rawChildren) && rawChildren.length > 0
      ? rawChildren.map((c, i) => normalizeNode(c, i, id))
      : undefined;

  return {
    id,
    menuId: raw.menuId,
    label: String(raw.label ?? id),
    command: raw.command ? String(raw.command).trim().toUpperCase() : undefined,
    menuType: raw.menuType === "POPUP" ? "POPUP" : "SCREEN",
    children,
  };
}

/**
 * Universal GUM Navigation Tree Parser used by the menu service and sidebar.
 */
export function parseMNU(
  rawPayload: unknown,
): { success: true; data: MenuItem[] } | { success: false; error: string } {
  if (!rawPayload) return { success: true, data: [] };

  try {
    const decoded = decodeProtobufValue<unknown>(rawPayload);
    const list = unwrapRecordsPayload(decoded);
    const nodes = (
      Array.isArray(list) && list.length > 0
        ? list
        : Array.isArray(decoded)
          ? decoded
          : typeof decoded === "object" && decoded
            ? [decoded]
            : []
    ) as RawMenuNode[];

    const result = nodes
      .filter((node) => node && typeof node === "object" && node.isVisible !== false)
      .map((node, i) => normalizeNode(node, i));
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse navigation menu: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/* ========================================================================== */
/* 1. MENU CATALOG PARSERS (Table: SC_MENU)                                   */
/* ========================================================================== */

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

/**
 * Serializes internal MenuCatalogRecord for database storage or JSON preview.
 */
export function serializeMenuCatalogToWireJson(record: MenuCatalogRecord): MenuCatalogRecord {
  const result = menuCatalogRecordSchema.safeParse(record);
  return result.success ? result.data : record;
}

/* ========================================================================== */
/* 2. MENU TREE PARSERS (Table: SC_MENU_TREE)                                 */
/* ========================================================================== */

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

/**
 * Serializes internal MenuTreeRecord for database storage or JSON preview.
 */
export function serializeMenuTreeToWireJson(record: MenuTreeRecord): MenuTreeRecord {
  const result = menuTreeRecordSchema.safeParse(record);
  return result.success ? result.data : record;
}
