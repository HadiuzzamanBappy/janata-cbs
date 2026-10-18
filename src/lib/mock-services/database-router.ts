import "server-only";

import { CBS_DATABASE, SC_MODEL_CONFIG_LIVE } from "@fixtures";

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
  return {
    id: m.recordId,
    label: `${m.description} (${m.tableName})`,
    details: `${props.length} columns defined • ${m.category}`,
    record: m,
  };
}

/** Formats form config records with section count and target model */
function formatFormConfig(f: Record<string, unknown>) {
  const presentation = (f.presentation as { sections?: unknown[] }) ?? {};
  const sections = presentation.sections ?? [];
  return {
    id: f.recordId,
    label: `${f.title} (${f.targetModel})`,
    details: `${sections.length} sections • ${f.targetModel}`,
    record: f,
  };
}

/** Formats inquiry config records with column count and target model */
function formatInquiryConfig(i: Record<string, unknown>) {
  const cols = (i.columns as unknown[]) ?? [];
  const filters = (i.filters as unknown[]) ?? [];
  return {
    id: i.id || i.recordId,
    label: `${i.title} (${i.targetModel})`,
    details: `${cols.length} columns • ${filters.length} filters • ${i.targetModel}`,
    record: i,
  };
}

const TABLE_FORMATTERS: Record<string, (item: Record<string, unknown>) => unknown> = {
  CUSTOMER: formatCustomer,
  CUST_CUSTOMER: formatCustomer,
  CONTROL: formatControl,
  SC_CONTROL: formatControl,
  USER: formatUser,
  SYS_USER: formatUser,
  "MODEL.CONFIG": formatModelConfig,
  SC_MODEL_CONFIG: formatModelConfig,
  "SC.MODEL.CONFIG": formatModelConfig,
  "FORM.CONFIG": formatFormConfig,
  SC_FORM_CONFIG: formatFormConfig,
  "SC.FORM.CONFIG": formatFormConfig,
  "INQUIRY.CONFIG": formatInquiryConfig,
  SC_INQUIRY_CONFIG: formatInquiryConfig,
  "SC.INQUIRY.CONFIG": formatInquiryConfig,
};

/**
 * Resolves a logical controlName or physical table name to its canonical CBS table.
 */
export function resolveTable(controlName: string): ResolvedTable | null {
  if (!controlName) return null;
  const clean = controlName.trim().toUpperCase();

  const db = CBS_DATABASE as unknown as Record<
    string,
    { LIVE?: Record<string, Record<string, unknown>> } | undefined
  >;

  // 1. Direct lookup in CBS_DATABASE
  const direct = db[clean] || db[clean.replace(/\./g, "_")] || db[clean.replace(/_/g, ".")];
  const targetTable = direct;
  let tableName = clean;

  // 2. If not found, resolve via SC_MODEL_CONFIG [PREFIX]_[TABLE_NAME]
  if (!targetTable?.LIVE) {
    const model =
      SC_MODEL_CONFIG_LIVE[clean] ||
      SC_MODEL_CONFIG_LIVE[clean.replace(/\./g, "_")] ||
      SC_MODEL_CONFIG_LIVE[clean.replace(/_/g, ".")];
    if (model) {
      tableName = `${model.prefix}_${model.tableName}`;
      const mapped = db[tableName];
      if (mapped?.LIVE) {
        return buildResolvedTable(tableName, mapped.LIVE, model.prefix);
      }
    }
    return null;
  }

  const modelDef =
    SC_MODEL_CONFIG_LIVE[clean] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/\./g, "_")] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/_/g, ".")];

  return buildResolvedTable(tableName, targetTable.LIVE, modelDef?.prefix);
}

function buildResolvedTable(
  tableName: string,
  live: Record<string, Record<string, unknown>>,
  prefix?: string,
): ResolvedTable {
  const formatter = TABLE_FORMATTERS[tableName];
  return {
    name: tableName,
    LIVE: live,
    getList: () => {
      const records = Object.values(live);
      return formatter ? records.map(formatter) : records;
    },
    prefix,
  };
}
