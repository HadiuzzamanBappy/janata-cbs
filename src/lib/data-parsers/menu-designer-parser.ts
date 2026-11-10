import { z } from "zod";
import {
  type MenuAction,
  type MenuItem,
  type MenuTreeRecord,
  type MenuType,
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
  title?: string;
  command?: string;
  componentName?: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
  children?: RawMenuNode[];
  items?: RawMenuNode[];
  isVisible?: boolean;
  orderIndex?: number;
  [key: string]: unknown;
}

const VALID_MENU_TYPES: readonly MenuType[] = ["GROUP", "INQUIRY", "FORM", "REPORT"] as const;

function normalizeNode(raw: RawMenuNode, idx: number, parentKey = "m"): MenuItem {
  const id = String(raw.id ?? raw.menuId ?? `${parentKey}-${idx}`);
  const rawChildren = raw.children ?? raw.items;
  const children: MenuItem[] =
    Array.isArray(rawChildren) && rawChildren.length > 0
      ? rawChildren.map((c, i) => normalizeNode(c, i, id))
      : [];

  const rawMenuType = (raw.menuType ? String(raw.menuType).toUpperCase() : undefined) as
    | MenuType
    | undefined;
  const trimmedCmd = raw.command ? String(raw.command).trim().toUpperCase() : "";
  const inferredType: MenuType | undefined = trimmedCmd.startsWith("INQ")
    ? "INQUIRY"
    : children.length > 0
      ? "GROUP"
      : trimmedCmd
        ? "FORM"
        : undefined;

  const menuType =
    rawMenuType && VALID_MENU_TYPES.includes(rawMenuType) ? rawMenuType : inferredType;
  const menuAction = String(raw.menuAction ?? "").toUpperCase() === "POPUP" ? "POPUP" : "SCREEN";
  const label = String(raw.label ?? raw.title ?? id).trim();
  const command = trimmedCmd || undefined;

  return {
    id,
    menuId: raw.menuId,
    label,
    title: label,
    command,
    componentName: raw.componentName || (command ? command.replace(/\./g, "_") : undefined),
    menuType,
    menuAction,
    isVisible: raw.isVisible !== false,
    orderIndex: typeof raw.orderIndex === "number" ? raw.orderIndex : idx,
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

    const data = nodes
      .filter((node) => Boolean(node) && typeof node === "object" && node.isVisible !== false)
      .map((node, i) => normalizeNode(node, i));

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse navigation menu: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/* ========================================================================== */
/* 1. MENU TREE PARSERS (Table: SC_MENU_TREE)                                 */
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
  const target =
    decoded &&
    typeof decoded === "object" &&
    !("treeDescription" in decoded || "menuTree" in decoded)
      ? (unwrapRecordsPayload(decoded)[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded))
      : decoded;

  const res = menuTreeRecordSchema.safeParse(target);
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: `MenuTree validation failed: ${res.error.message}` };
}

/**
 * Parses a list of menu tree records from CBS backend wire responses.
 */
export function parseMenuTreeList(
  rawPayload: unknown,
): { success: true; data: MenuTreeRecord[] } | { success: false; error: string } {
  if (!rawPayload) return { success: true, data: [] };
  const rawList = unwrapRecordsPayload(rawPayload);
  const res = z.array(menuTreeRecordSchema).safeParse(rawList);
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: `Menu tree list validation failed: ${res.error.message}` };
}

/* ========================================================================== */
/* 2. MENU TREE SANITIZATION & SERIALIZATION (Table: SC_MENU_TREE)            */
/* ========================================================================== */

/**
 * Sanitizes an individual menu item node recursively for wire persistence:
 * - Trims label, title, and command strings
 * - Normalizes menuType (GROUP for folder nodes with children, INQUIRY/FORM for leaves)
 * - Sequentially aligns orderIndex
 * - Recursively purges empty/transient UI properties from children
 */
export function sanitizeMenuTreeNode(node: MenuItem, idx: number): MenuItem {
  const label = (node.label ?? node.title ?? `node-${idx}`).trim();
  const rawCmd = node.command ? node.command.trim() : "";
  const children = Array.isArray(node.children)
    ? node.children
        .filter((child): child is MenuItem => Boolean(child) && typeof child === "object")
        .map((child, childIdx) => sanitizeMenuTreeNode(child, childIdx))
    : [];

  const inferredType: MenuType =
    children.length > 0 ? "GROUP" : rawCmd.toUpperCase().startsWith("INQ") ? "INQUIRY" : "FORM";
  const menuType = node.menuType ?? inferredType;

  return {
    id: String(node.id || `node-${idx}`),
    menuId: node.menuId,
    label,
    title: node.title?.trim() || label,
    command: rawCmd || undefined,
    componentName: node.componentName?.trim() || (rawCmd ? rawCmd.replace(/\./g, "_") : undefined),
    menuType,
    menuAction: node.menuAction === "POPUP" ? "POPUP" : "SCREEN",
    isVisible: node.isVisible !== false,
    orderIndex: idx,
    children,
  };
}

/**
 * Sanitizes internal MenuTreeRecord for database storage or wire transmission.
 * Ensures consistent trimmed strings, sequential node order, and schema conformity.
 */
export function sanitizeMenuTreeRecord(record: MenuTreeRecord): MenuTreeRecord {
  const sanitized: MenuTreeRecord = {
    recordId: record.recordId ? record.recordId.trim().toUpperCase() : undefined,
    treeDescription: (record.treeDescription ?? "").trim(),
    isActive: record.isActive !== false,
    menuTree: Array.isArray(record.menuTree)
      ? record.menuTree
          .filter((item): item is MenuItem => Boolean(item) && typeof item === "object")
          .map((item, idx) => sanitizeMenuTreeNode(item, idx))
      : [],
    auditData: record.auditData,
  };

  const result = menuTreeRecordSchema.safeParse(sanitized);
  return result.success ? result.data : sanitized;
}
