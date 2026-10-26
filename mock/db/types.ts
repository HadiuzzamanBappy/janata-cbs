/**
 * CBS Table Associate Suffixes:
 * - LIVE: Authorized live records (Production)
 * - INAU: Input / Unauthorized records waiting for checker authorization
 * - HIS: Historical audit snapshots from previous modifications
 * - DEL: Soft-deleted / reversed records
 */
export type CbsTableVersion = "LIVE" | "INAU" | "HIS" | "DEL";

export interface CbsVersionedTable<T = Record<string, unknown>> {
  LIVE: Record<string, T>;
  INAU: Record<string, T>;
  HIS: Record<string, T[]>;
  DEL: Record<string, T>;
}

/**
 * Universal lookup helper for CBS versioned tables (Temenos Pattern).
 * Queries records cleanly by record ID and target version (defaults to "LIVE").
 * e.g. queryVersionedRecord(table, "AC1001", "INAU")
 */
export function queryVersionedRecord<T>(
  table: CbsVersionedTable<T>,
  recordId: string,
  version: CbsTableVersion = "LIVE",
): T | T[] | null {
  if (!recordId) return null;
  const cleanId = recordId.trim();
  const bucket = table[version];
  if (!bucket) return null;
  return (bucket[cleanId] ?? bucket[cleanId.toUpperCase()] ?? null) as T | T[] | null;
}

