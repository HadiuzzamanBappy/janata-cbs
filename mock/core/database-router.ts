import "server-only";

import {
  type CbsTableVersion,
  type CbsVersionedTable,
  getVersionedTable,
  SC_MODEL_CONFIG,
} from "@mock/db";

export interface ResolvedTable {
  name: string;
  physicalName: string;
  LIVE: Record<string, Record<string, unknown>>;
  table: CbsVersionedTable<Record<string, unknown>>;
  getList: (version?: CbsTableVersion) => unknown[];
  getIdList: (searchPattern?: string, version?: CbsTableVersion) => string[];
  prefix?: string;
}

/**
 * Resolves a logical CBS Control Name (e.g. "ACCOUNT") or physical name ("AC_ACCOUNT")
 * to its canonical table in CBS_DATABASE, returning an accessor bundle for queries.
 */
export function resolveTable(controlName: string): ResolvedTable | null {
  if (!controlName) return null;
  const clean = controlName.trim().toUpperCase();

  const versionedTable = getVersionedTable(clean);
  if (!versionedTable?.LIVE) return null;

  const model =
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => m.TABLENAME === clean || `${m.PREFIX}_${m.TABLENAME}` === clean,
    );

  const physicalName = model ? `${model.PREFIX}_${model.TABLENAME}` : clean;

  return {
    name: clean,
    physicalName,
    LIVE: versionedTable.LIVE,
    table: versionedTable,

    /** Returns all records as an array from the specified version bucket (default: "LIVE") */
    getList: (version: CbsTableVersion = "LIVE") => {
      const bucket = versionedTable[version];
      if (!bucket || Array.isArray(bucket)) return [];

      return Object.entries(bucket).map(([key, item]) => {
        const id = String(item.recordId || item.id || key).trim();
        const hasComma = key.includes(",");
        const targetModel = item.targetModel || (hasComma ? key.split(",")[0].trim() : undefined);
        const itemVersion = item.version || (hasComma ? key.split(",")[1]?.trim() : undefined);

        const audit = item.auditData as Record<string, unknown> | undefined;
        const status =
          item.status || (audit?.recStatus === "AU" ? "ACTIVE" : audit?.recStatus) || "ACTIVE";

        return {
          status,
          ...item,
          recordId: id,
          id,
          ...(targetModel ? { targetModel } : {}),
          ...(itemVersion ? { version: itemVersion } : {}),
        };
      });
    },

    /** Returns all record keys, optionally filtered by search pattern (default: "LIVE") */
    getIdList: (searchPattern?: string, version: CbsTableVersion = "LIVE") => {
      const bucket = versionedTable[version];
      if (!bucket || Array.isArray(bucket)) return [];

      // Clean Temenos wildcard dots (e.g. "...AC..." -> "AC")
      const cleanPattern = searchPattern
        ? searchPattern.replace(/\.+/g, "").trim().toUpperCase()
        : "";

      return Object.entries(bucket)
        .map(([key, item]) => String(key || item.recordId || item.id).trim())
        .filter((id) => !cleanPattern || id.toUpperCase().includes(cleanPattern));
    },

    prefix: model?.PREFIX,
  };
}
