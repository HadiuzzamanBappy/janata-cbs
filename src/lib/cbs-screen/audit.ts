// ============================================================================
// CBS Screen Audit Configuration & Data Adapter
// ============================================================================

import type { CbsAuditFooterData, CbsAuditRawData } from "./types";

export interface AuditFieldDef {
  readonly path: string;
  readonly label: string;
  readonly wireName?: string;
  readonly description?: string;
  readonly type: "text" | "number" | "date" | "status";
  readonly icon: "user" | "shield" | "calendar" | "hash" | "code" | "alert";
  readonly section: string;
}

export interface AuditSectionDef {
  readonly id: string;
  readonly title: string;
  readonly wireTag?: string;
}

export const DEFAULT_AUDIT_SECTIONS: readonly AuditSectionDef[] = [
  {
    id: "LEDGER",
    title: "CBS Ledger & Audit Summary",
  },
  {
    id: "PERSONNEL",
    title: "Lifecycle Sign-off & Personnel Details",
  },
];

export const DEFAULT_AUDIT_FIELDS: readonly AuditFieldDef[] = [
  // --- Section 1: LEDGER ---
  {
    path: "auditData.recStatus",
    label: "Record Status",
    wireName: "recStatus",
    type: "status",
    icon: "shield",
    section: "LEDGER",
  },
  {
    path: "auditData.recCurrNumber",
    label: "Current Sequence / Revision",
    wireName: "recCurrNumber",
    type: "number",
    icon: "hash",
    section: "LEDGER",
  },
  {
    path: "auditData.recBranchCode",
    label: "Operating Company Code",
    wireName: "recBranchCode",
    type: "text",
    icon: "shield",
    section: "LEDGER",
  },

  // --- Section 2: PERSONNEL ---
  {
    path: "auditData.recInputter",
    label: "Input Operator",
    wireName: "recInputter",
    description: "User ID responsible for initial draft input and security modifications",
    type: "text",
    icon: "user",
    section: "PERSONNEL",
  },
  {
    path: "auditData.recAuthorizer",
    label: "Authorizing Supervisor",
    wireName: "recAuthorizer",
    description: "Dual-control supervisor signature confirming record approval",
    type: "text",
    icon: "shield",
    section: "PERSONNEL",
  },
];

/**
 * Extracts nested audit value from record via dot-path notation.
 */
export function extractAuditValue(record: unknown, path: string): unknown {
  if (!record || typeof record !== "object") return undefined;
  const rec = record as Record<string, unknown>;

  if (path.startsWith("auditData.")) {
    const key = path.replace("auditData.", "");
    const auditObj = rec.auditData as Record<string, unknown> | undefined;
    return auditObj ? auditObj[key] : undefined;
  }

  return rec[path];
}

/**
 * Normalizes raw record audit data into standard CbsAuditFooter props.
 */
export function formatAuditFooterData(
  raw?: CbsAuditRawData | null,
): CbsAuditFooterData | undefined {
  if (!raw) return undefined;
  return {
    recordStatus: raw.recStatus,
    currNo: raw.recCurrNumber,
    inputter: raw.recInputter,
    dateTime: raw.recAuthTime || raw.recInputTime,
    authoriser: raw.recAuthorizer,
    coCode: raw.recBranchCode,
  };
}
