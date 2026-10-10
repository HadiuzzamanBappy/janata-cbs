import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface AuditFieldDef {
  path: string;
  label: string;
  wireName?: string;
  description?: string;
  type: "text" | "number" | "date" | "status";
  icon: "user" | "shield" | "calendar" | "hash" | "code" | "alert";
  section: "DEVELOPMENT" | "LEDGER" | "PERSONNEL";
}

export const AUDIT_SECTIONS: Array<{
  id: "DEVELOPMENT" | "LEDGER" | "PERSONNEL";
  title: string;
  wireTag?: string;
}> = [
  {
    id: "DEVELOPMENT",
    title: "Development & Schema Metadata",
    wireTag: "devBy / devDate",
  },
  {
    id: "LEDGER",
    title: "CBS Ledger & Audit Summary",
  },
  {
    id: "PERSONNEL",
    title: "Lifecycle Sign-off & Personnel Details",
  },
];

/**
 * Declarative registry of all Audit & Ledger fields.
 * Any new audit metadata (e.g. deptCode, auditDate, coCode) can be declared here in 1 line.
 */
export const AUDIT_FIELD_REGISTRY: AuditFieldDef[] = [
  // --- Section 1: DEVELOPMENT ---
  {
    path: "devBy",
    label: "Developed By",
    wireName: "devBy",
    type: "text",
    icon: "user",
    section: "DEVELOPMENT",
  },
  {
    path: "devDate",
    label: "Development Date",
    wireName: "devDate",
    type: "date",
    icon: "calendar",
    section: "DEVELOPMENT",
  },

  // --- Section 2: LEDGER ---
  {
    path: "auditData.recStatus",
    label: "Record Status",
    wireName: "recStatus",
    type: "status",
    icon: "hash",
    section: "LEDGER",
  },
  {
    path: "auditData.recCurrNumber",
    label: "Revision",
    wireName: "recCurrNumber",
    type: "number",
    icon: "hash",
    section: "LEDGER",
  },
  {
    path: "auditData.recBranchCode",
    label: "Branch Code",
    wireName: "recBranchCode",
    type: "text",
    icon: "shield",
    section: "LEDGER",
  },
  {
    path: "tableName",
    label: "Table Identifier",
    wireName: "tableName",
    type: "text",
    icon: "alert",
    section: "LEDGER",
  },

  // --- Section 3: PERSONNEL ---
  {
    path: "auditData.recInputter",
    label: "Record Inputter",
    wireName: "recInputter",
    description: "User who created/last modified this schema definition",
    type: "text",
    icon: "user",
    section: "PERSONNEL",
  },
  {
    path: "auditData.recAuthorizer",
    label: "Record Authorizer",
    wireName: "recAuthorizer",
    description: "Supervisor / dual-control user who authorized this version",
    type: "text",
    icon: "shield",
    section: "PERSONNEL",
  },
];

export function getAuditFieldValue(record: ModelConfigRecord, path: string): unknown {
  if (path.startsWith("auditData.")) {
    const key = path.replace("auditData.", "") as keyof NonNullable<typeof record.auditData>;
    return record.auditData?.[key];
  }
  return record[path as keyof ModelConfigRecord];
}
