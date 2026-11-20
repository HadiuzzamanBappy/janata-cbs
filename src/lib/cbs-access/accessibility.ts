import {
  CBS_CONTROLLED_FUNCTIONS,
  CbsRecordFunction,
  type CbsUserSecurityContext,
  isCbsMutationRequest,
} from "@/types";

/**
 * Checks if a user has a specific function code right in their accessibility rights.
 */
export function hasAccessibilityRight(
  granted?: readonly string[] | null,
  required?: CbsRecordFunction,
): boolean {
  if (!granted || !required) return false;
  return granted.includes(required);
}

/**
 * Server-side gate for API route handlers (e.g. /api/proxy).
 * Validates that the active user possesses the required capability before executing controlled actions.
 * Returns null if allowed, or an error payload if denied.
 */
export function verifyUserRecordAccess(
  user: CbsUserSecurityContext,
  recordFunction?: string | null,
): { message: string; funcCode: CbsRecordFunction } | null {
  if (!recordFunction) return null;

  const funcCode = recordFunction.toUpperCase().trim() as CbsRecordFunction;
  if (!CBS_CONTROLLED_FUNCTIONS.includes(funcCode)) return null;

  const rights = user.accessibility ?? [];
  if (!rights.includes(funcCode)) {
    return {
      message: `Access Denied: Missing '${funcCode}' capability in user profile.`,
      funcCode,
    };
  }

  return null;
}

/**
 * Server-side gate for zero-auth (`authLevel: 0`, trailing-comma screens). A level-0 mutation
 * authorizes the record in the same step, so the sender must also hold the Authorize ('A') right.
 * Returns null if allowed, or an error payload if denied.
 */
export function verifyZeroAuthAccess(
  user: CbsUserSecurityContext,
  requestType: string,
  authLevel?: number,
): { message: string; funcCode: CbsRecordFunction } | null {
  if (authLevel !== 0 || !isCbsMutationRequest(requestType)) return null;
  if (hasAccessibilityRight(user.accessibility, CbsRecordFunction.AUTHORIZE)) return null;

  return {
    message: `Access Denied: Zero-auth entry requires the '${CbsRecordFunction.AUTHORIZE}' capability in user profile.`,
    funcCode: CbsRecordFunction.AUTHORIZE,
  };
}
