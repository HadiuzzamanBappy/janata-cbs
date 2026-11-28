import { CBS_IDLE_MODE, CbsRecordFunction, CbsRecordStatus, type CbsScreenMode } from "@/types";
import type { CbsAccessContext, CbsAccessResult } from "./types";

/**
 * Designer field lock: a record's fields are editable only in Input ('I') mode.
 * In every other mode (Idle, See, Authorize, Hold, Delete, Reverse) the form is read-only.
 */
export function isRecordEditable(mode: CbsScreenMode): boolean {
  return mode === CbsRecordFunction.INPUT;
}

/**
 * The record function a screen mode reads with: the mode itself when it is a function (so
 * Authorize, Hold, Reverse... get the copy they act on), otherwise See (Idle).
 */
export function recordFunctionOfMode(mode: CbsScreenMode): CbsRecordFunction {
  return (Object.values(CbsRecordFunction) as string[]).includes(mode)
    ? (mode as CbsRecordFunction)
    : CbsRecordFunction.SEE;
}

/** Why the maker can't authorize: the Authorize tooltip and the proxy's 403 message. */
export const FOUR_EYES_REASON =
  "Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction.";

/**
 * Four-Eyes: true when `userId` is the record's maker (`recInputter`), compared without case or
 * spaces. The screen uses it to disable Authorize, and `/api/proxy` to refuse the request.
 */
export function isRecordMaker(userId?: string | null, recordInputter?: string | null): boolean {
  return Boolean(
    userId && recordInputter && userId.trim().toUpperCase() === recordInputter.trim().toUpperCase(),
  );
}

/**
 * Pure, deterministic banking capability evaluator.
 * Evaluates user profile rights against record lifecycle state and Four-Eyes Maker-Checker compliance.
 */
export function evaluateCbsAccess(context: CbsAccessContext = {}): CbsAccessResult {
  const { user, recordStatus, recordInputter, mode = CBS_IDLE_MODE } = context;

  const userId = context.userId ?? user?.userId;
  const grantedRights = (context.grantedRights ??
    user?.accessibility ??
    []) as readonly CbsRecordFunction[];

  const hasRight = (code: CbsRecordFunction) => grantedRights.includes(code);

  const cleanStatus = (recordStatus || "").toUpperCase().trim();
  const isIdle = mode === CBS_IDLE_MODE;

  // Four-Eyes Rule: If the record has an inputter, the Maker cannot authorize their own transaction
  const isFourEyesViolation = isRecordMaker(userId, recordInputter);

  // 1. Can See: Requires 'S' right
  const canSee = hasRight(CbsRecordFunction.SEE);

  // 2. Can Input / Amend: Requires 'I' right
  const canInput = hasRight(CbsRecordFunction.INPUT);

  // 3. Can Delete: Requires 'D' right and an active pending/new draft (cannot delete live AU records)
  const canDelete =
    hasRight(CbsRecordFunction.DELETE) &&
    !isIdle &&
    (cleanStatus === CbsRecordStatus.UA ||
      cleanStatus === CbsRecordStatus.NEW ||
      cleanStatus === "");

  // 4. Can Hold: Requires the 'H' right (as the proxy does) on non-authorized drafts
  const canHold = hasRight(CbsRecordFunction.HOLD) && !isIdle && cleanStatus !== CbsRecordStatus.AU;

  // 5. Can Authorize: Requires 'A' right, pending 'UA' status, not in IDLE, and passes Four-Eyes
  const canAuthorize =
    hasRight(CbsRecordFunction.AUTHORIZE) &&
    !isIdle &&
    cleanStatus === CbsRecordStatus.UA &&
    !isFourEyesViolation;

  // 6. Can Reverse: Requires 'R' right on live authorized 'AU' records
  const canReverse =
    hasRight(CbsRecordFunction.REVERSE) && !isIdle && cleanStatus === CbsRecordStatus.AU;

  // 7. Can List: Requires 'L' right
  const canList = hasRight(CbsRecordFunction.LIST);

  // 8. Screen Read-Only: Locked if viewing, in action execution modes, or lacking 'I' right
  const isReadOnly =
    mode === CbsRecordFunction.SEE ||
    mode === CbsRecordFunction.HOLD ||
    mode === CbsRecordFunction.AUTHORIZE ||
    mode === CbsRecordFunction.DELETE ||
    mode === CbsRecordFunction.REVERSE ||
    !canInput;

  // 9. View-Only: See and Authorize lock the action bar's Commit/Validate/Hold (other modes keep them)
  const isViewOnly = mode === CbsRecordFunction.SEE || mode === CbsRecordFunction.AUTHORIZE;

  const getDisableReason = (action: CbsRecordFunction): string | null => {
    if (!hasRight(action)) {
      return `Access Denied: Missing '${action}' capability in user profile.`;
    }

    if (action === CbsRecordFunction.AUTHORIZE) {
      if (isFourEyesViolation) {
        return FOUR_EYES_REASON;
      }
      if (cleanStatus && cleanStatus !== CbsRecordStatus.UA) {
        return `Cannot Authorize: Record status is '${cleanStatus}' (must be pending '${CbsRecordStatus.UA}').`;
      }
    }

    if (action === CbsRecordFunction.DELETE) {
      if (cleanStatus === CbsRecordStatus.AU) {
        return "Cannot Delete: Record is already authorized. Use Reverse ('R') instead.";
      }
    }

    if (action === CbsRecordFunction.REVERSE) {
      if (cleanStatus !== CbsRecordStatus.AU) {
        return `Cannot Reverse: Record status is '${cleanStatus}' (must be live '${CbsRecordStatus.AU}').`;
      }
    }

    if (action === CbsRecordFunction.HOLD) {
      if (cleanStatus === CbsRecordStatus.AU) {
        return "Cannot Hold: Record is already authorized.";
      }
    }

    if (action === CbsRecordFunction.INPUT && isReadOnly) {
      return "Screen is in Read-Only mode.";
    }

    return null;
  };

  return {
    hasFunctionRight: hasRight,
    canSee,
    canInput,
    canDelete,
    canHold,
    canAuthorize,
    canReverse,
    canList,
    isReadOnly,
    isViewOnly,
    isFourEyesViolation,
    getDisableReason,
    grantedRights,
  };
}
