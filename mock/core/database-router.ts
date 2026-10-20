import "server-only";

import { CBS_DATABASE, SC_MODEL_CONFIG_LIVE } from "@mock/db";

export interface ResolvedTable {
  name: string;
  physicalName: string;
  LIVE: Record<string, Record<string, unknown>>;
  getList: () => unknown[];
  prefix?: string;
}

/**
 * Resolves a canonical Model Config controlName to its CBS table.
 */
export function resolveTable(controlName: string): ResolvedTable | null {
  if (!controlName) return null;
  const cleanCmd = controlName.trim().toUpperCase();

  const modelEntry =
    Object.entries(SC_MODEL_CONFIG_LIVE).find(([key]) => key === cleanCmd) ||
    Object.entries(SC_MODEL_CONFIG_LIVE).find(
      ([_, m]) => `${m.prefix}_${m.tableName}` === cleanCmd || m.tableName === cleanCmd,
    );

  const modelKey = modelEntry ? modelEntry[0] : cleanCmd;
  const model = modelEntry ? modelEntry[1] : undefined;

  const db = CBS_DATABASE as unknown as Record<
    string,
    { LIVE?: Record<string, Record<string, unknown>> } | undefined
  >;

  const targetTable = db[modelKey] || db[cleanCmd];

  if (!targetTable?.LIVE) return null;

  const physicalName = model ? `${model.prefix}_${model.tableName}` : cleanCmd;
  return buildResolvedTable(cleanCmd, targetTable.LIVE, physicalName, model?.prefix);
}

function buildResolvedTable(
  controlName: string,
  live: Record<string, Record<string, unknown>>,
  physicalName: string,
  prefix?: string,
): ResolvedTable {
  return {
    name: controlName,
    physicalName,
    LIVE: live,
    getList: () => {
      return Object.entries(live).map(([key, item]) => {
        const id = String(item.recordId || item.id || key).trim();
        const hasComma = key.includes(",");
        const targetModel = item.targetModel || (hasComma ? key.split(",")[0].trim() : undefined);
        const version = item.version || (hasComma ? key.split(",")[1]?.trim() : undefined);

        return {
          ...item,
          recordId: id,
          id,
          ...(targetModel ? { targetModel } : {}),
          ...(version ? { version } : {}),
        };
      });
    },
    prefix,
  };
}
