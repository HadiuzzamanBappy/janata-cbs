import "server-only";

import {
  CBS_DATABASE,
  type CbsTableVersion,
  type CbsVersionedTable,
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

  // 1. Direct O(1) hashmap lookup in SC_MODEL_CONFIG, or fallback to physical name lookup
  const model =
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => `${m.prefix}_${m.tableName}` === clean || m.tableName === clean,
    );

  // 2. Resolve canonical model key for CBS_DATABASE
  const modelKey = (
    SC_MODEL_CONFIG[clean]
      ? clean
      : Object.keys(SC_MODEL_CONFIG).find((k) => SC_MODEL_CONFIG[k] === model) || clean
  ) as keyof typeof CBS_DATABASE;

  const versionedTable = CBS_DATABASE[modelKey] as unknown as
    | CbsVersionedTable<Record<string, unknown>>
    | undefined;

  if (!versionedTable?.LIVE) return null;

  const physicalName = model ? `${model.prefix}_${model.tableName}` : clean;

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
        .map(([key, item]) =>
          String(item.recordId || item.id || item.code || item.userId || key).trim(),
        )
        .filter((id) => !cleanPattern || id.toUpperCase().includes(cleanPattern));
    },

    prefix: model?.prefix,
  };
}
