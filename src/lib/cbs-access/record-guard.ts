import { CbsRecordFunction, CbsRecordStatus } from "@/types";
import type { CbsAccessContext, CbsAccessResult } from "./types";

/**
 * Pure, deterministic banking capability evaluator.
 * Evaluates user profile rights against record lifecycle state and Four-Eyes Maker-Checker compliance.
 */
export function evaluateCbsAccess(context: CbsAccessContext = {}): CbsAccessResult {
  const { user, recordStatus, recordInputter, mode = "IDLE" } = context;

  const userId = context.userId ?? user?.userId;
  const grantedRights = (context.grantedRights ??
    user?.accessibility ??
    []) as readonly CbsRecordFunction[];

  const hasRight = (code: CbsRecordFunction) => grantedRights.includes(code);

  const cleanStatus = (recordStatus || "").toUpperCase().trim();
  const isIdle = mode === "IDLE";

  // Four-Eyes Rule: If the record has an inputter, the Maker cannot authorize their own transaction
  const isFourEyesViolation = Boolean(
    userId && recordInputter && userId.trim().toUpperCase() === recordInputter.trim().toUpperCase(),
  );

  // 1. Can See: Requires 'S' right
  const canSee = hasRight(CbsRecordFunction.SEE);

  // 2. Can Input / Amend: Requires 'I' right
  const canInput = hasRight(CbsRecordFunction.INPUT);

  // 3. Can Delete: Requires 'D' right and an active pending/new draft (cannot delete live AU records)
  const canDelete =
    hasRight(CbsRecordFunction.DELETE) &&
    !isIdle &&
    (cleanStatus === CbsRecordStatus.INA ||
      cleanStatus === CbsRecordStatus.NEW ||
      cleanStatus === "");

  // 4. Can Hold: Requires 'I' or 'H' right on non-authorized drafts
  const canHold =
    (hasRight(CbsRecordFunction.HOLD) || hasRight(CbsRecordFunction.INPUT)) &&
    !isIdle &&
    cleanStatus !== CbsRecordStatus.AU;

  // 5. Can Authorize: Requires 'A' right, pending 'INA' status, not in IDLE, and passes Four-Eyes
  const canAuthorize =
    hasRight(CbsRecordFunction.AUTHORIZE) &&
    !isIdle &&
    cleanStatus === CbsRecordStatus.INA &&
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

  const getDisableReason = (action: CbsRecordFunction): string | null => {
    if (!hasRight(action)) {
      return `Access Denied: Missing '${action}' capability in user profile.`;
    }

    if (action === CbsRecordFunction.AUTHORIZE) {
      if (isFourEyesViolation) {
        return "Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction.";
      }
      if (cleanStatus && cleanStatus !== CbsRecordStatus.INA) {
        return `Cannot Authorize: Record status is '${cleanStatus}' (must be pending '${CbsRecordStatus.INA}').`;
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
    isFourEyesViolation,
    getDisableReason,
    grantedRights,
  };
}
