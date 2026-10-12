import { CBS_FUNCTION_CODES, type CbsRecordFunction } from "@/types";

/* -------------------------------------------------------------------------- */
/* Accessibility Profile Parser                                               */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes and extracts standard RIDASH function rights from an accessibility string or array.
 * Strictly reflects database wire rights without artificial fallbacks.
 */
export function parseAccessibilityRights(
  rawAccessibility?: string | readonly string[] | null,
): CbsRecordFunction[] {
  if (!rawAccessibility) {
    return [];
  }

  if (Array.isArray(rawAccessibility)) {
    return rawAccessibility
      .map((r) => String(r).toUpperCase().trim() as CbsRecordFunction)
      .filter((r) => CBS_FUNCTION_CODES.includes(r));
  }

  const str = String(rawAccessibility).toUpperCase().trim();
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

  return matched;
}

/* -------------------------------------------------------------------------- */
/* Access Right Verification Helper                                           */
/* -------------------------------------------------------------------------- */

/**
 * Checks if user accessibility profile grants a given function code.
 */
export function hasAccessibilityRight(
  granted: readonly CbsRecordFunction[],
  required: CbsRecordFunction,
): boolean {
  return granted.includes(required);
}
