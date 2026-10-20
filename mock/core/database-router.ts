import "server-only";

import { CBS_DATABASE, SC_MODEL_CONFIG_LIVE } from "@mock/db";

export interface ResolvedTable {
  name: string;
  LIVE: Record<string, Record<string, unknown>>;
  getList: () => unknown[];
  prefix?: string;
}

/** Formats customer records with catalog picker metadata */
function formatCustomer(c: Record<string, unknown>) {
  return {
    id: c.recordId,
    label: c.fullName as string,
    details: `DOB: ${c.dateOfBirth}`,
    ...c,
  };
}

/** Formats control records with command metadata */
function formatControl(ctl: Record<string, unknown>) {
  return {
    id: ctl.recordId,
    label: ctl.description as string,
    ...ctl,
  };
}

/** Formats system user records with security profile metadata */
function formatUser(u: Record<string, unknown>) {
  return {
    id: u.recordId,
    label: `${u.fullName} (${u.userId})`,
    details: `${u.branchName} • ${(u.userRole as string[])?.join(", ")}`,
    ...u,
  };
}

/** Formats model config records with metamodel columns and category */
function formatModelConfig(m: Record<string, unknown>) {
  const props = (m.properties as unknown[]) ?? [];
  const id = String(m.recordId || m.id || m.tableName || "").trim();
  return {
    id,
    recordId: id,
    label: `${m.description || id} (${m.tableName || id})`,
    details: `${props.length} columns defined • ${m.category || "SYSTEM"}`,
    record: m,
  };
}

/** Formats form config records with section count and target model */
function formatFormConfig(f: Record<string, unknown>) {
  const presentation = (f.presentation as { sections?: unknown[] }) ?? {};
  const sections = presentation.sections ?? [];
  const id = String(f.recordId || f.id || "").trim();
  return {
    id,
    recordId: id,
    label: `${f.title} (${f.targetModel})`,
    details: `${sections.length} sections • ${f.targetModel}`,
    record: f,
  };
}

/** Formats inquiry config records with column count and target model */
function formatInquiryConfig(i: Record<string, unknown>) {
  const cols = (i.columns as unknown[]) ?? [];
  const filters = (i.filters as unknown[]) ?? [];
  const id = String(i.id || i.recordId || "").trim();
  return {
    id,
    recordId: id,
    label: `${i.title} (${i.targetModel})`,
    details: `${cols.length} columns • ${filters.length} filters • ${i.targetModel}`,
    record: i,
  };
}
/** Formats account records with currency and branch details */
function formatAccount(a: Record<string, unknown>) {
  const id = String(a.recordId || a.id || "").trim();
  return {
    id,
    recordId: id,
    label:
      (a.accountTitle as string) ||
      (a.specialInstructions as string) ||
      `Account #${id} (${a.currency || "BDT"})`,
    details: `${a.accountType || "SAVINGS"} • ${a.currency || "BDT"} • Branch: ${a.branchCode || "JB0001"}`,
    ...a,
  };
}

/** Formats branch master records with routing and type */
function formatBranch(b: Record<string, unknown>) {
  const id = String(b.recordId || b.branchCode || "").trim();
  return {
    id,
    recordId: id,
    label: (b.branchTitle as string) || id,
    details: `${b.routingNumber ? `Routing: ${b.routingNumber} • ` : ""}${(b.branchType as string) || "Branch"}`,
    ...b,
  };
}

/** Formats menu catalog records with command and menuType */
function formatMenu(m: Record<string, unknown>) {
  const id = String(m.recordId || m.id || "").trim();
  return {
    id,
    recordId: id,
    label: (m.label as string) || (m.description as string) || id,
    details: m.command ? `Command: ${m.command}` : (m.menuType as string) || "MENU",
    ...m,
  };
}

/** Formats user group security records with menus and roles count */
function formatUserGroup(ug: Record<string, unknown>) {
  const id = String(ug.recordId || ug.id || "").trim();
  const menus = (ug.menuIds as unknown[]) || [];
  const roles = (ug.roleIds as unknown[]) || [];
  return {
    id,
    recordId: id,
    label: (ug.groupLabel as string) || id,
    details: `${menus.length} menus • ${roles.length} roles`,
    ...ug,
  };
}

const TABLE_FORMATTERS: Record<string, (item: Record<string, unknown>) => unknown> = {
  ACCOUNT: formatAccount,
  CUSTOMER: formatCustomer,
  BRANCH: formatBranch,
  CONTROL: formatControl,
  USER: formatUser,
  "USER.GROUP": formatUserGroup,
  MENU: formatMenu,
  "MODEL.CONFIG": formatModelConfig,
  "FORM.CONFIG": formatFormConfig,
  "INQUIRY.CONFIG": formatInquiryConfig,
};

/**
 * Resolves a canonical Model Config controlName to its CBS table.
 */
export function resolveTable(controlName: string): ResolvedTable | null {
  if (!controlName) return null;
  const cleanCmd = controlName.trim().toUpperCase();

  const model = SC_MODEL_CONFIG_LIVE[cleanCmd];
  const db = CBS_DATABASE as unknown as Record<
    string,
    { LIVE?: Record<string, Record<string, unknown>> } | undefined
  >;

  // Lookup by canonical Model Config key, or physical tableName (${model.prefix}_${model.tableName})
  const physicalName = model ? `${model.prefix}_${model.tableName}` : cleanCmd;
  const targetTable = db[cleanCmd] || db[physicalName];

  if (!targetTable?.LIVE) return null;

  return buildResolvedTable(cleanCmd, targetTable.LIVE, model?.prefix);
}

function buildResolvedTable(
  controlName: string,
  live: Record<string, Record<string, unknown>>,
  prefix?: string,
): ResolvedTable {
  const formatter = TABLE_FORMATTERS[controlName];
  return {
    name: controlName,
    LIVE: live,
    getList: () => {
      const records = Object.entries(live).map(([key, item]) => {
        const id = String(item.recordId || item.id || key).trim();
        return {
          ...item,
          recordId: id,
          id,
        };
      });
      return formatter ? records.map(formatter) : records;
    },
    prefix,
  };
}
