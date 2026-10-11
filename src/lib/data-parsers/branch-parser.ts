import type { BranchRecord } from "@/lib/data-schemas";
import { unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Wire Parser API                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Standard parser to map CBS branch response to domain BranchRecord items.
 * Purely extracts database wire fields without artificial mock defaults.
 */
export function parseBranchesWirePayload(data: unknown): BranchRecord[] {
  const values = unwrapRecordsPayload<Record<string, unknown>>(data);

  return values.map((f) => ({
    recordId: String(f.recordId || ""),
    branchTitle: String(f.branchTitle || ""),
    branchType: f.branchType ? String(f.branchType) : undefined,
    branchContact: Array.isArray(f.branchContact)
      ? (f.branchContact as BranchRecord["branchContact"])
      : [],
    openDate: f.openDate ? String(f.openDate) : undefined,
    branchOpenDate: f.branchOpenDate ? String(f.branchOpenDate) : undefined,
    branchAddress: f.branchAddress ? String(f.branchAddress) : undefined,
    currTxnDate: f.currTxnDate ? String(f.currTxnDate) : undefined,
    isActive: typeof f.isActive === "boolean" ? f.isActive : true,
    bbCode: f.bbCode ? String(f.bbCode) : undefined,
    divCode: f.divCode ? String(f.divCode) : undefined,
    areaCode: f.areaCode ? String(f.areaCode) : undefined,
    gradeCode: f.gradeCode ? String(f.gradeCode) : undefined,
    countryCode: f.countryCode ? String(f.countryCode) : undefined,
    routingNumber: f.routingNumber ? String(f.routingNumber) : undefined,
    swiftCode: f.swiftCode ? String(f.swiftCode) : undefined,
    parentBranch: f.parentBranch ? String(f.parentBranch) : undefined,
    auditData: f.auditData as BranchRecord["auditData"],
  }));
}
