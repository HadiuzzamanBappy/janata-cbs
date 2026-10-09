import type { BranchRecord } from "@/lib/schemas";
import { unwrapRecordsPayload } from "./protobuf-decoder";

/**
 * Standard parser to map CBS branch response to domain BranchRecord items.
 * Executed identically for both live gRPC and static mock modes.
 */
export function parseBranchesWirePayload(data: unknown): BranchRecord[] {
  const values = unwrapRecordsPayload<Record<string, unknown>>(data);

  return values.map((f) => ({
    recordId: String(f.recordId || ""),
    branchTitle: String(f.branchTitle || ""),
    branchType: String(f.branchType || "BR"),
    branchContact: Array.isArray(f.branchContact)
      ? (f.branchContact as BranchRecord["branchContact"])
      : [],
    openDate: String(f.openDate || f.branchOpenDate || ""),
    branchOpenDate: String(f.openDate || f.branchOpenDate || ""),
    branchAddress: String(f.branchAddress || "Main Road"),
    currTxnDate: String(f.currTxnDate || "2026-01-07"),
    isActive: f.isActive !== false,
    bbCode: f.bbCode ? String(f.bbCode) : undefined,
    divCode: String(f.divCode || ""),
    areaCode: String(f.areaCode || ""),
    gradeCode: f.gradeCode ? String(f.gradeCode) : undefined,
    countryCode: String(f.countryCode || "BD"),
    routingNumber: f.routingNumber ? String(f.routingNumber) : undefined,
    swiftCode: f.swiftCode ? String(f.swiftCode) : undefined,
    parentBranch: f.parentBranch ? String(f.parentBranch) : undefined,
    auditData: f.auditData as BranchRecord["auditData"],
  }));
}
