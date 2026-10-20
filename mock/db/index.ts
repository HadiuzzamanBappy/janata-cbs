// Canonical CBS Database Tables (Prefix_TableName)

export * from "./AC_ACCOUNT";
export * from "./CUST_CUSTOMER";
export * from "./SC_BRANCH";
export * from "./SC_CONTROL";
export * from "./SC_FORM_CONFIG";
export * from "./SC_INQUIRY_CONFIG";
export * from "./SC_MENU";
export * from "./SC_MENU_TREE";
export * from "./SC_MODEL_CONFIG";
export * from "./SC_USER_GROUP";
export * from "./SYS_USER";
export * from "./types";

import { AC_ACCOUNT_TABLE } from "./AC_ACCOUNT";
import { CUST_CUSTOMER_TABLE } from "./CUST_CUSTOMER";
import { SC_BRANCH_TABLE } from "./SC_BRANCH";
import { SC_CONTROL_TABLE } from "./SC_CONTROL";
import { SC_FORM_CONFIG_TABLE } from "./SC_FORM_CONFIG";
import { SC_INQUIRY_CONFIG_TABLE } from "./SC_INQUIRY_CONFIG";
import { SC_MENU_TABLE } from "./SC_MENU";
import { SC_MENU_TREE_TABLE } from "./SC_MENU_TREE";
import { SC_MODEL_CONFIG_TABLE } from "./SC_MODEL_CONFIG";
import { SC_USER_GROUP_TABLE } from "./SC_USER_GROUP";
import { SYS_USER_TABLE } from "./SYS_USER";
import { type CbsTableVersion, type CbsVersionedTable, queryVersionedRecord } from "./types";

/**
 * Universal In-Memory Database Registry for CBS Offline / Mock Operations.
 * Keyed by Canonical Model Name and Table Name.
 */
export const CBS_DATABASE = {
  ACCOUNT: AC_ACCOUNT_TABLE,
  BRANCH: SC_BRANCH_TABLE,
  CONTROL: SC_CONTROL_TABLE,
  CUSTOMER: CUST_CUSTOMER_TABLE,
  "FORM.CONFIG": SC_FORM_CONFIG_TABLE,
  "INQUIRY.CONFIG": SC_INQUIRY_CONFIG_TABLE,
  MENU: SC_MENU_TABLE,
  "MENU.TREE": SC_MENU_TREE_TABLE,
  "MODEL.CONFIG": SC_MODEL_CONFIG_TABLE,
  USER: SYS_USER_TABLE,
  "USER.GROUP": SC_USER_GROUP_TABLE,
} as const;

/**
 * Universal Database Query Helper:
 * Queries any CBS table by model/table name and record ID, supporting versioning.
 */
export function queryCbsDatabase<T = Record<string, unknown>>(
  tableOrModelName: string,
  recordId: string,
  version: CbsTableVersion = "LIVE",
): T | T[] | null {
  const cleanName = tableOrModelName.trim().toUpperCase() as keyof typeof CBS_DATABASE;
  const table = CBS_DATABASE[cleanName] as unknown as CbsVersionedTable<T> | undefined;
  if (!table) return null;
  return queryVersionedRecord(table, recordId, version);
}
