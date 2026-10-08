export interface AuditFieldDef {
  path: string;
  label: string;
  wireName?: string;
  description?: string;
  type: "text" | "number" | "date" | "status";
  icon: "user" | "shield" | "calendar" | "hash" | "code" | "alert";
  section: string;
}

export interface AuditSectionDef {
  id: string;
  title: string;
  wireTag?: string;
}

export const DEFAULT_AUDIT_SECTIONS: AuditSectionDef[] = [
  {
    id: "LEDGER",
    title: "CBS Ledger & Audit Summary",
  },
  {
    id: "PERSONNEL",
    title: "Lifecycle Sign-off & Personnel Details",
  },
];

export const DEFAULT_AUDIT_FIELDS: AuditFieldDef[] = [
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
