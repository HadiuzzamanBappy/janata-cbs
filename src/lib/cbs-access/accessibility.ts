import { CBS_FUNCTION_CODES, type CbsRecordFunction } from "@/types";

/**
 * Normalizes and extracts standard RIDASH function rights from an accessibility string or array.
 * Handles "FULL", "RIDASH", "RS", "I", etc.
 */
export function parseAccessibilityRights(
  rawAccessibility?: string | string[] | null,
): CbsRecordFunction[] {
  if (!rawAccessibility) {
    return [...CBS_FUNCTION_CODES];
  }

  if (Array.isArray(rawAccessibility)) {
    return rawAccessibility
      .map((r) => r.toUpperCase().trim() as CbsRecordFunction)
      .filter((r) => CBS_FUNCTION_CODES.includes(r));
  }

  const str = rawAccessibility.toUpperCase().trim();
  if (str === "FULL" || str === "ALL") {
    return [...CBS_FUNCTION_CODES];
  }

  const validSet = new Set<string>(CBS_FUNCTION_CODES);
  const matched: CbsRecordFunction[] = [];

  for (const char of str) {
    if (validSet.has(char) && !matched.includes(char as CbsRecordFunction)) {
      matched.push(char as CbsRecordFunction);
    }
  }

  return matched.length > 0 ? matched : [...CBS_FUNCTION_CODES];
}

/**
 * Checks if user accessibility profile grants a given function code.
 */
export function hasAccessibilityRight(
  granted: CbsRecordFunction[],
  required: CbsRecordFunction,
): boolean {
  return granted.includes(required);
}
