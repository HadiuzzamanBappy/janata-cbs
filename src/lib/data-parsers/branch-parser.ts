import { unwrapRecordsPayload } from "./protobuf-decoder";

/** One branch from the core's branch directory (`GRL` on `BRANCH`). */
export interface BranchRecord {
  readonly code: string;
  readonly name: string;
  readonly branchType: string;
}

/**
 * Parses a decoded branch directory payload: `recordId` → code, `branchTitle` → name (falls back
 * to the code). Records without a code are dropped. Used by the client branch list and by the
 * server's branch-switch check, so both read the core's records the same way.
 */
export function parseBranchDirectory(data: unknown): BranchRecord[] {
  return unwrapRecordsPayload<{ recordId?: string; branchTitle?: string; branchType?: string }>(
    data,
  )
    .map((b) => {
      const code = String(b.recordId ?? "").trim();
      return {
        code,
        name: String(b.branchTitle ?? "").trim() || code,
        branchType: String(b.branchType ?? "").trim(),
      };
    })
    .filter((b) => Boolean(b.code));
}
