import { unwrapRecordsPayload } from "./protobuf-decoder";
import type { BranchRecord } from "@/lib/schemas";

/**
 * Standard parser to map CBS branch response to domain BranchRecord items.
 * Executed identically for both live gRPC and static mock modes.
 */
export function parseBranchesWirePayload(data: unknown): BranchRecord[] {
  const values = unwrapRecordsPayload<Record<string, unknown>>(data);

  return values.map((f) => ({
    recordId: String(f.recordId || ""),
    branchTitle: String(f.branchTitle || ""),
    branchAddress: String(f.branchAddress || "Main Road"),
    branchOpenDate: String(f.openDate || f.branchOpenDate || ""),
    currTxnDate: String(f.currTxnDate || "2026-01-07"),
    divCode: String(f.divCode || ""),
    areaCode: String(f.areaCode || ""),
  }));
}

