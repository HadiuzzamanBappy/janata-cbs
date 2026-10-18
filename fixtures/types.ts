/**
 * CBS Table Associate Suffixes:
 * - LIVE: Authorized live records (Production)
 * - INAU / UNA / NAU: Input / Unauthorized records waiting for checker authorization
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
 * Universal lookup helper for CBS versioned tables supporting:
 * 1. String suffixing: e.g. "ACCOUNT$NAU", "ACCOUNT$INAU", "ACCOUNT$HIS", "ACCOUNT$DEL"
 * 2. Explicit version parameter: e.g. queryVersionedRecord(table, "ACCOUNT", "INAU")
 */
export function queryVersionedRecord<T>(
  table: CbsVersionedTable<T>,
  recordId: string,
  version: "HIS",
): T[] | null;
export function queryVersionedRecord<T>(
  table: CbsVersionedTable<T>,
  recordId: string,
  version?: "LIVE" | "INAU" | "DEL",
): T | null;
export function queryVersionedRecord<T>(
  table: CbsVersionedTable<T>,
  recordId: string,
  version?: CbsTableVersion,
): T | T[] | null;
export function queryVersionedRecord<T>(
  table: CbsVersionedTable<T>,
  recordId: string,
  version: CbsTableVersion = "LIVE",
): T | T[] | null {
  if (!recordId) return null;
  const clean = recordId.trim();
  const upper = clean.toUpperCase();

  // Handle explicit version suffix in ID string
  if (upper.endsWith("$NAU") || upper.endsWith("$INAU")) {
    const base = clean.replace(/\$(NAU|INAU)$/i, "");
    return table.INAU[base] ?? table.INAU[base.toUpperCase()] ?? null;
  }
  if (upper.endsWith("$HIS")) {
    const base = clean.replace(/\$HIS$/i, "");
    return table.HIS[base] ?? table.HIS[base.toUpperCase()] ?? null;
  }
  if (upper.endsWith("$DEL")) {
    const base = clean.replace(/\$DEL$/i, "");
    return table.DEL[base] ?? table.DEL[base.toUpperCase()] ?? null;
  }

  // Handle explicit version argument
  if (version === "INAU") {
    return table.INAU[clean] ?? table.INAU[upper] ?? null;
  }
  if (version === "HIS") {
    return table.HIS[clean] ?? table.HIS[upper] ?? null;
  }
  if (version === "DEL") {
    return table.DEL[clean] ?? table.DEL[upper] ?? null;
  }

  return table.LIVE[clean] ?? table.LIVE[upper] ?? null;
}
