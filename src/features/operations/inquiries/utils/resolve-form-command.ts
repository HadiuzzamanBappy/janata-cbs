import type { InquiryConfigRecord } from "@/lib/data-schemas";

/**
 * Resolves the target GMC/CBS form application command from the inquiry schema code
 * for drill-down action handling.
 */
export function resolveDrillDownFormCommand(
  schema: InquiryConfigRecord | null,
  recordId: string,
): string {
  if (!schema) return recordId;
  return schema.controllerName?.trim().toUpperCase() || schema.id?.trim().toUpperCase() || recordId;
}
