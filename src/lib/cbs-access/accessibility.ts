import {
  CBS_CONTROLLED_FUNCTIONS,
  CbsRecordFunction,
  CbsRequestType,
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

/** Verbs that are a controlled function by themselves, whatever `recordFunction` says. */
const REQUEST_TYPE_RIGHTS: Readonly<Partial<Record<string, CbsRecordFunction>>> = {
  [CbsRequestType.AUT]: CbsRecordFunction.AUTHORIZE,
  [CbsRequestType.AMC]: CbsRecordFunction.AUTHORIZE,
  [CbsRequestType.DEL]: CbsRecordFunction.DELETE,
  [CbsRequestType.REV]: CbsRecordFunction.REVERSE,
  [CbsRequestType.TRV]: CbsRecordFunction.REVERSE,
  [CbsRequestType.HLD]: CbsRecordFunction.HOLD,
};

/**
 * The rights a request needs: the controlled function it sends, plus the one its verb implies.
 * A mutation that names no controlled function needs Input ('I'), so leaving `recordFunction`
 * out (or sending `S` with a `PUT`) never skips the check, and `AUT` sent as `I` still needs 'A'.
 */
function requiredRights(requestType: string, recordFunction?: string | null): CbsRecordFunction[] {
  const sent = (recordFunction ?? "").trim().toUpperCase() as CbsRecordFunction;
  const rights = new Set<CbsRecordFunction>();
  if (CBS_CONTROLLED_FUNCTIONS.includes(sent)) rights.add(sent);
  const implied = REQUEST_TYPE_RIGHTS[requestType];
  if (implied) rights.add(implied);
  if (rights.size === 0 && isCbsMutationRequest(requestType)) rights.add(CbsRecordFunction.INPUT);
  return [...rights];
}

/**
 * Server-side gate for API route handlers (e.g. /api/proxy): the user must hold every right the
 * request needs (`requiredRights`). Returns null if allowed, or the first missing right.
 */
export function verifyUserRecordAccess(
  user: CbsUserSecurityContext,
  requestType: string,
  recordFunction?: string | null,
): { message: string; funcCode: CbsRecordFunction } | null {
  const granted = user.accessibility ?? [];
  const funcCode = requiredRights(requestType, recordFunction).find((r) => !granted.includes(r));
  if (!funcCode) return null;
  return {
    message: `Access Denied: Missing '${funcCode}' capability in user profile.`,
    funcCode,
  };
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
