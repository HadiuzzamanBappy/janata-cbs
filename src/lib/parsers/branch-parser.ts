import type { BranchRecord } from "@/lib/schemas";

/**
 * Standard parser to map raw CBS Protobuf branch response to domain BranchRecord items.
 * Executed identically for both live gRPC and static mock modes.
 */
export function parseBranchesWirePayload(data: unknown): BranchRecord[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const fields = (obj.fields || obj) as Record<string, unknown>;
  const records = fields.records as Record<string, unknown> | undefined;
  const listValue = records?.list_value as Record<string, unknown> | undefined;
  const values = Array.isArray(listValue?.values) ? listValue.values : [];

  return values.map((item) => {
    const itemObj = item as Record<string, unknown>;
    const f = ((itemObj.struct_value as Record<string, unknown>)?.fields ||
      itemObj.fields ||
      itemObj) as Record<string, Record<string, unknown>>;

    const getStr = (key: string): string => {
      const v = f?.[key];
      return typeof v?.string_value === "string" ? v.string_value.trim() : "";
    };

    return {
      recordId: getStr("recordId"),
      branchTitle: getStr("branchTitle"),
      branchAddress: getStr("branchAddress") || "Main Road",
      branchOpenDate: getStr("openDate"),
      currTxnDate: "2026-01-07",
      divCode: getStr("divCode"),
      areaCode: getStr("areaCode"),
    };
  });
}
