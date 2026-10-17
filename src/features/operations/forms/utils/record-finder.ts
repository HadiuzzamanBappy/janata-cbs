import {
  AC_ACCOUNT_LIVE,
  CUST_CUSTOMER_LIVE,
  SC_CONTROL_LIVE,
  SC_MENU_LIVE,
  SC_MENU_TREE_LIVE,
} from "@fixtures";
import type { ParsedFormData } from "@/lib/data-schemas";

/**
 * Direct lookup across canonical database tables by table model code and record ID.
 */
export function findRecordInFixtures(
  cleanModel: string,
  cleanId: string,
): Record<string, unknown> | undefined {
  if (!cleanId) return undefined;
  const model = cleanModel.trim().toUpperCase();
  const id = cleanId.trim().toUpperCase();

  switch (model) {
    case "ACCOUNT":
      return AC_ACCOUNT_LIVE[id];
    case "CUSTOMER":
      return CUST_CUSTOMER_LIVE[id];
    case "CONTROL":
      return SC_CONTROL_LIVE[id] as unknown as Record<string, unknown>;
    case "MENU":
      return SC_MENU_LIVE[id] as unknown as Record<string, unknown>;
    case "MENU_TREE":
    case "MENU.TREE":
      return SC_MENU_TREE_LIVE[id] as unknown as Record<string, unknown>;
    default:
      // Fallback search across core entity tables
      return (
        AC_ACCOUNT_LIVE[id] ||
        CUST_CUSTOMER_LIVE[id] ||
        (SC_CONTROL_LIVE[id] as unknown as Record<string, unknown>)
      );
  }
}

/**
 * Identifies the primary key / record ID field definition in a form schema.
 */
export function findPrimaryKeyField(schema: ParsedFormData | null) {
  if (!schema?.fields) return undefined;
  return schema.fields.find(
    (f) =>
      f.fieldKey.toUpperCase().includes("ID") ||
      f.fieldKey.toUpperCase().includes("CODE") ||
      f.fieldKey.toUpperCase().includes("NUMBER"),
  );
}

/**
 * Maps static fixtures for a given model to quick-record dropdown items.
 */
export function getAvailableFixtureRecords(modelCode?: string): Array<{
  id: string;
  label: string;
  details: string;
}> {
  if (!modelCode) return [];
  const model = modelCode.trim().toUpperCase();

  let table: Record<string, Record<string, unknown>> = {};
  if (model === "ACCOUNT") table = AC_ACCOUNT_LIVE;
  else if (model === "CUSTOMER") table = CUST_CUSTOMER_LIVE;
  else if (model === "CONTROL")
    table = SC_CONTROL_LIVE as unknown as Record<string, Record<string, unknown>>;
  else if (model === "MENU")
    table = SC_MENU_LIVE as unknown as Record<string, Record<string, unknown>>;
  else if (model === "MENU_TREE" || model === "MENU.TREE")
    table = SC_MENU_TREE_LIVE as unknown as Record<string, Record<string, unknown>>;

  return Object.keys(table).map((recId) => {
    const rec = table[recId];
    const label =
      (rec.label as string) ||
      (rec.treeDescription as string) ||
      (rec.fullName as string) ||
      (rec.description as string) ||
      (rec.accountType as string) ||
      `Record #${recId}`;
    const status = (rec.status as string) || "LIVE";
    return {
      id: recId,
      label,
      details: `Status: ${status} | Auth: YES`,
    };
  });
}
