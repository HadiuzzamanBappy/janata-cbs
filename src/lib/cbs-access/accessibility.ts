import { CBS_FUNCTION_CODES, CbsRecordFunction } from "@/types";

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
    const valid = rawAccessibility
      .map((r) => String(r).toUpperCase().trim() as CbsRecordFunction)
      .filter((r) => CBS_FUNCTION_CODES.includes(r));
    return Array.from(new Set(valid));
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

/* -------------------------------------------------------------------------- */
/* Server-Side Capability Gate (Maker-Checker & RIDASHL Verification)         */
/* -------------------------------------------------------------------------- */

export interface UserAccessProfile {
  userId?: string;
  accessibility?: string | null;
  functionRights?: readonly string[] | null;
}

const CONTROLLED_FUNCTIONS = new Set<CbsRecordFunction>([
  CbsRecordFunction.AUTHORIZE,
  CbsRecordFunction.DELETE,
  CbsRecordFunction.REVERSE,
  CbsRecordFunction.HOLD,
  CbsRecordFunction.INPUT,
]);

/**
 * Validates whether a user holds the necessary RIDASHL capability to execute a function code.
 * Returns null if allowed, or an error message string if denied.
 */
export function verifyUserRecordAccess(
  user: UserAccessProfile,
  recordFunction?: string | null,
): { message: string; funcCode: CbsRecordFunction } | null {
  if (!recordFunction) return null;

  const funcCode = recordFunction.toUpperCase().trim() as CbsRecordFunction;
  if (!CONTROLLED_FUNCTIONS.has(funcCode)) return null;

  const rights = parseAccessibilityRights(
    user.functionRights?.length ? user.functionRights : user.accessibility,
  );

  if (!rights.includes(funcCode)) {
    return {
      message: `Access Denied: Missing '${funcCode}' capability in user profile.`,
      funcCode,
    };
  }

  return null;
}
