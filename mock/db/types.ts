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
