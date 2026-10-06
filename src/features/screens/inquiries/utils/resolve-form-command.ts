import type { EnquirySchema } from "@/lib/schemas";

/**
 * Resolves the target GMC/CBS form application command from the inquiry schema code
 * for drill-down action handling.
 */
export function resolveDrillDownFormCommand(
  schema: EnquirySchema | null,
  recordId: string,
): string {
  if (!schema) return recordId;

  const baseCode = schema.code.replace(/^(?:INQ\s+|INQUIRY\s+)/i, "").trim();

  if (baseCode === "USER.LIST" || baseCode === "GET.EMP.INFO") {
    return "USER.MGT";
  }

  if (baseCode === "ACCOUNT" || baseCode.includes("ACC")) {
    return "ACCOUNT";
  }

  if (baseCode.includes("CUST")) {
    return "CUSTOMER";
  }

  return baseCode;
}
