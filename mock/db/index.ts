// Canonical CBS Database Tables (Prefix_TableName)

export * from "./AC_ACCOUNT";
export * from "./CUST_CUSTOMER";
export * from "./FT_FUNDS_TRANSFER";
export * from "./SC_BRANCH";
export * from "./SC_CONTROL";
export * from "./SC_FORM_CONFIG";
export * from "./SC_INQUIRY_CONFIG";
export * from "./SC_LOOKUP";
export * from "./SC_MENU";
export * from "./SC_MENU_TREE";
export * from "./SC_MODEL_CONFIG";
export * from "./SC_USER";
export * from "./types";
export * from "./UM_PASSWORD_RESET";
export * from "./UM_USER_MGT";
export * from "./UM_USERS";

import { AC_ACCOUNT_TABLE } from "./AC_ACCOUNT";
import { CUST_CUSTOMER_TABLE } from "./CUST_CUSTOMER";
import { FT_FUNDS_TRANSFER_TABLE } from "./FT_FUNDS_TRANSFER";
import { SC_BRANCH_TABLE } from "./SC_BRANCH";
import { SC_CONTROL_TABLE } from "./SC_CONTROL";
import { SC_FORM_CONFIG_TABLE } from "./SC_FORM_CONFIG";
import { SC_INQUIRY_CONFIG_TABLE } from "./SC_INQUIRY_CONFIG";
import { SC_LOOKUP_TABLE } from "./SC_LOOKUP";
import { SC_MENU_TABLE } from "./SC_MENU";
import { SC_MENU_TREE_TABLE } from "./SC_MENU_TREE";
import { SC_MODEL_CONFIG, SC_MODEL_CONFIG_TABLE } from "./SC_MODEL_CONFIG";
import { SC_USER_TABLE } from "./SC_USER";
import type { CbsVersionedTable } from "./types";
import { UM_PASSWORD_RESET_TABLE } from "./UM_PASSWORD_RESET";
import { UM_USER_MGT_TABLE } from "./UM_USER_MGT";
import { UM_USERS_TABLE } from "./UM_USERS";

/**
 * Physical Database Tables (Strictly PREFIX_TABLENAME matching DB Schemas).
 * All physical persistence tables in CBS are uniquely identified by Prefix_TableName.
 */
export const CBS_PHYSICAL_TABLES = {
  AC_ACCOUNT: AC_ACCOUNT_TABLE,
  CUST_CUSTOMER: CUST_CUSTOMER_TABLE,
  FT_FUNDS_TRANSFER: FT_FUNDS_TRANSFER_TABLE,
  SC_BRANCH: SC_BRANCH_TABLE,
  SC_CONTROL: SC_CONTROL_TABLE,
  SC_FORM_CONFIG: SC_FORM_CONFIG_TABLE,
  SC_INQUIRY_CONFIG: SC_INQUIRY_CONFIG_TABLE,
  SC_LOOKUP: SC_LOOKUP_TABLE,
  SC_MENU: SC_MENU_TABLE,
  SC_MENU_TREE: SC_MENU_TREE_TABLE,
  SC_MODEL_CONFIG: SC_MODEL_CONFIG_TABLE,
  SC_USER: SC_USER_TABLE,
  UM_USERS: UM_USERS_TABLE,
  UM_USER_MGT: UM_USER_MGT_TABLE,
  UM_PASSWORD_RESET: UM_PASSWORD_RESET_TABLE,
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
  const rawClean = controlName.trim().toUpperCase();
  const clean = rawClean.includes("$") ? rawClean.split("$")[0] : rawClean;

  // 1. Direct physical table hit (e.g. AC_ACCOUNT, SC_FORM_CONFIG)
  if (clean in CBS_PHYSICAL_TABLES) {
    return CBS_PHYSICAL_TABLES[clean as CbsPhysicalTableName] as unknown as CbsVersionedTable<T>;
  }

  // 2. Strict lookup in SC_MODEL_CONFIG by model key or TABLENAME
  const normalizedKey = clean.replace(".", "_");
  const model =
    SC_MODEL_CONFIG[clean] ||
    SC_MODEL_CONFIG[normalizedKey] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) =>
        m.TABLENAME === clean ||
        m.TABLENAME === normalizedKey ||
        `${m.PREFIX}_${m.TABLENAME}` === clean ||
        `${m.PREFIX}_${m.TABLENAME}` === normalizedKey,
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
