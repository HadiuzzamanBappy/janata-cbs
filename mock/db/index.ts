// Canonical CBS Database Tables (Prefix_TableName)

export * from "./AC_ACCOUNT";
export * from "./CUST_CUSTOMER";
export * from "./SC_BRANCH";
export * from "./SC_CONTROL";
export * from "./SC_FORM_CONFIG";
export * from "./SC_INQUIRY_CONFIG";
export * from "./SC_MENU_TREE";
export * from "./SC_MODEL_CONFIG";
export * from "./SC_USER";
export * from "./types";

import { AC_ACCOUNT_TABLE } from "./AC_ACCOUNT";
import { CUST_CUSTOMER_TABLE } from "./CUST_CUSTOMER";
import { SC_BRANCH_TABLE } from "./SC_BRANCH";
import { SC_CONTROL_TABLE } from "./SC_CONTROL";
import { SC_FORM_CONFIG_TABLE } from "./SC_FORM_CONFIG";
import { SC_INQUIRY_CONFIG_TABLE } from "./SC_INQUIRY_CONFIG";
import { SC_MENU_TREE_TABLE } from "./SC_MENU_TREE";
import { SC_MODEL_CONFIG, SC_MODEL_CONFIG_TABLE } from "./SC_MODEL_CONFIG";
import { SC_USER_TABLE } from "./SC_USER";
import { type CbsTableVersion, type CbsVersionedTable, queryVersionedRecord } from "./types";

/**
 * Physical Database Tables (Strictly PREFIX_TABLENAME matching DB Schemas).
 * All physical persistence tables in CBS are uniquely identified by Prefix_TableName.
 */
export const CBS_PHYSICAL_TABLES = {
  AC_ACCOUNT: AC_ACCOUNT_TABLE,
  CUST_CUSTOMER: CUST_CUSTOMER_TABLE,
  SC_BRANCH: SC_BRANCH_TABLE,
  SC_CONTROL: SC_CONTROL_TABLE,
  SC_FORM_CONFIG: SC_FORM_CONFIG_TABLE,
  SC_INQUIRY_CONFIG: SC_INQUIRY_CONFIG_TABLE,
  SC_MENU_TREE: SC_MENU_TREE_TABLE,
  SC_MODEL_CONFIG: SC_MODEL_CONFIG_TABLE,
  SC_USER: SC_USER_TABLE,
} as const;

export type CbsPhysicalTableName = keyof typeof CBS_PHYSICAL_TABLES;

/**
 * Automatically resolves a versioned table from any control name or model key
 * using SC_MODEL_CONFIG to determine PREFIX and TABLENAME.
 */
export function getVersionedTable<T = Record<string, unknown>>(
  controlName: string,
): CbsVersionedTable<T> | null {
  if (!controlName) return null;
  const clean = controlName.trim().toUpperCase();

  // 1. Direct physical table hit (e.g. AC_ACCOUNT, SC_FORM_CONFIG)
  if (clean in CBS_PHYSICAL_TABLES) {
    return CBS_PHYSICAL_TABLES[clean as CbsPhysicalTableName] as unknown as CbsVersionedTable<T>;
  }

  // 2. Strict lookup in SC_MODEL_CONFIG by model key or TABLENAME
  const model =
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => m.TABLENAME === clean || `${m.PREFIX}_${m.TABLENAME}` === clean,
    );

  if (model) {
    const physicalName = `${model.PREFIX}_${model.TABLENAME}` as CbsPhysicalTableName;
    if (physicalName in CBS_PHYSICAL_TABLES) {
      return CBS_PHYSICAL_TABLES[physicalName] as unknown as CbsVersionedTable<T>;
    }
  }

  // If not present in model config or physical tables, do not assume -> return null
  return null;
}

/**
 * Universal In-Memory Database Registry for CBS Offline / Mock Operations.
 * Dynamically resolves any canonical model name or physical table name via SC_MODEL_CONFIG.
 */
export const CBS_DATABASE = new Proxy(
  CBS_PHYSICAL_TABLES as unknown as Record<string, CbsVersionedTable<Record<string, unknown>>>,
  {
    get(_target, prop: string | symbol) {
      if (typeof prop !== "string") return undefined;
      return getVersionedTable(prop);
    },
    has(_target, prop: string | symbol) {
      if (typeof prop !== "string") return false;
      return getVersionedTable(prop) !== null;
    },
  },
);

/**
 * Universal Database Query Helper:
 * Queries any CBS table by control/model name and record ID, supporting versioning.
 */
export function queryCbsDatabase<T = Record<string, unknown>>(
  controlName: string,
  recordId: string,
  version: CbsTableVersion = "LIVE",
): T | T[] | null {
  const table = getVersionedTable<T>(controlName);
  if (!table) return null;
  return queryVersionedRecord(table, recordId, version);
}
