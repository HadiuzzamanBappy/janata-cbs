import { STATIC_FORM_DATA } from "@fixtures";
import type { FormSchema } from "@/lib/schemas";

/**
 * Searches static CBS fixtures for a record by ID.
 * First checks target model table, then falls back to other tables.
 */
export function findRecordInFixtures(
  cleanModel: string,
  cleanId: string,
): Record<string, unknown> | undefined {
  if (!cleanId) return undefined;

  const modelTable = STATIC_FORM_DATA[cleanModel.toUpperCase()];
  let found = modelTable?.records?.[cleanId];

  if (!found) {
    for (const tbl of Object.values(STATIC_FORM_DATA)) {
      if (tbl.records?.[cleanId]) {
        found = tbl.records[cleanId];
        break;
      }
    }
  }

  return found;
}

/**
 * Identifies the primary key / record ID field definition in a form schema.
 */
export function findPrimaryKeyField(schema: FormSchema | null) {
  if (!schema?.fields) return undefined;
  return schema.fields.find(
    (f) =>
      f.name.toUpperCase().includes("ID") ||
      f.name.toUpperCase().includes("CODE") ||
      f.name.toUpperCase().includes("NUMBER"),
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
  const modelTable = STATIC_FORM_DATA[modelCode.toUpperCase()];
  if (!modelTable?.records) return [];

  return Object.keys(modelTable.records).map((recId) => {
    const rec = modelTable.records[recId];
    const label =
      (rec["ACCOUNT.TITLE"] as string) ||
      (rec["NAME.1"] as string) ||
      (rec["FULL.NAME"] as string) ||
      (rec["TXN.CODE"] as string) ||
      `Record #${recId}`;
    const status = (rec["RECORD.STATUS"] as string) || (rec.STATUS as string) || "LIVE";
    return {
      id: recId,
      label,
      details: `Status: ${status} | Auth: YES`,
    };
  });
}
