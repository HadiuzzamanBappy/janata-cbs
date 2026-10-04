import { extractStringField, getItemFields, unwrapRecordsPayload } from "@/lib/grpc/struct";
import type { BranchRecord } from "@/lib/schemas";

/**
 * Standard parser to map raw CBS Protobuf branch response to domain BranchRecord items.
 * Executed identically for both live gRPC and static mock modes.
 */
export function parseBranchesWirePayload(data: unknown): BranchRecord[] {
  const values = unwrapRecordsPayload(data);

  return values.map((item) => {
    const f = getItemFields(item);

    return {
      recordId: extractStringField(f, "recordId"),
      branchTitle: extractStringField(f, "branchTitle"),
      branchAddress: extractStringField(f, "branchAddress") || "Main Road",
      branchOpenDate: extractStringField(f, "openDate"),
      currTxnDate: extractStringField(f, "currTxnDate") || "2026-01-07",
      divCode: extractStringField(f, "divCode"),
      areaCode: extractStringField(f, "areaCode"),
    };
  });
}
