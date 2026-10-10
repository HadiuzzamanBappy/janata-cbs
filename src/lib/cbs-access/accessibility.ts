import { CBS_FUNCTION_CODES } from "@/types/cbs";
import type { CbsAccessFunctionCode } from "./types";

/**
 * Normalizes and extracts standard RIDASH function rights from an accessibility string or array.
 * Handles "FULL", "RIDASH", "RS", "I", etc.
 */
export function parseAccessibilityRights(
  rawAccessibility?: string | string[] | null,
): CbsAccessFunctionCode[] {
  if (!rawAccessibility) {
    return [...CBS_FUNCTION_CODES];
  }

  if (Array.isArray(rawAccessibility)) {
    return rawAccessibility
      .map((r) => r.toUpperCase().trim() as CbsAccessFunctionCode)
      .filter((r) => CBS_FUNCTION_CODES.includes(r));
  }

  const str = rawAccessibility.toUpperCase().trim();
  if (str === "FULL" || str === "ALL") {
    return [...CBS_FUNCTION_CODES];
  }

  const validSet = new Set<string>(CBS_FUNCTION_CODES);
  const matched: CbsAccessFunctionCode[] = [];

  for (const char of str) {
    if (validSet.has(char) && !matched.includes(char as CbsAccessFunctionCode)) {
      matched.push(char as CbsAccessFunctionCode);
    }
  }

  return matched.length > 0 ? matched : [...CBS_FUNCTION_CODES];
}

/**
 * Checks if user accessibility profile grants a given function code.
 */
export function hasAccessibilityRight(
  granted: CbsAccessFunctionCode[],
  required: CbsAccessFunctionCode,
): boolean {
  return granted.includes(required);
}
