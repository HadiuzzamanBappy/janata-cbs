import type { MenuCatalogRecord } from "@/lib/schemas/menu-catalog-schema";

export interface AuditFieldDef {
  path: string;
  label: string;
  wireName?: string;
  description?: string;
  type: "text" | "number" | "date" | "status";
  icon: "user" | "shield" | "calendar" | "hash" | "code" | "alert";
  section: "LEDGER" | "PERSONNEL";
}

export const AUDIT_SECTIONS: Array<{
  id: "LEDGER" | "PERSONNEL";
  title: string;
}> = [
  {
    id: "LEDGER",
    title: "CBS Ledger & Audit Summary",
  },
  {
    id: "PERSONNEL",
    title: "Lifecycle Sign-off & Personnel Details",
  },
];

export const MENU_AUDIT_FIELDS: AuditFieldDef[] = [
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
    description: "User ID responsible for initial draft input and modifications",
    type: "text",
    icon: "user",
    section: "PERSONNEL",
  },
  {
    path: "auditData.recAuthorizer",
    label: "Authorizing Supervisor",
    wireName: "recAuthorizer",
    description: "Supervisor signature confirming dual-control approval",
    type: "text",
    icon: "shield",
    section: "PERSONNEL",
  },
];

export function getAuditFieldValue(record: MenuCatalogRecord, path: string): unknown {
  if (path.startsWith("auditData.")) {
    const key = path.replace("auditData.", "") as keyof NonNullable<typeof record.auditData>;
    return record.auditData?.[key];
  }
  return record[path as keyof MenuCatalogRecord];
}
