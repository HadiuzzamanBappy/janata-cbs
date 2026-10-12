import { CBS_RECORD_FUNCTIONS, type CbsRecordFunction } from "@/types";

import type { CbsAccessContext, CbsAccessResult } from "./types";

/* -------------------------------------------------------------------------- */
/* Evaluation Input Contracts                                                 */
/* -------------------------------------------------------------------------- */

export interface EvaluateAccessParams extends CbsAccessContext {
  readonly userId?: string;
  readonly grantedRights: readonly CbsRecordFunction[];
}

/* -------------------------------------------------------------------------- */
/* Deterministic Capability & Four-Eyes Evaluator                             */
/* -------------------------------------------------------------------------- */

/**
 * Pure, deterministic banking capability evaluator.
 * Cross-references User Rights with Record Status and Four-Eyes Maker-Checker compliance.
 */
export function evaluateCbsAccess({
  userId,
  grantedRights = [],
  recordStatus,
  recordInputter,
  mode = "IDLE",
}: EvaluateAccessParams): CbsAccessResult {
  const rights = grantedRights ?? [];
  const hasRight = (code: CbsRecordFunction) => rights.includes(code);

  const cleanStatus = (recordStatus || "").toUpperCase().trim();
  const isIdle = mode === "IDLE";

  // Four-Eyes Rule: If the record has an inputter, the Maker cannot act as the Authorizer (Checker)
  const isFourEyesViolation = Boolean(
    userId && recordInputter && userId.toUpperCase().trim() === recordInputter.toUpperCase().trim(),
  );

  // 1. Can See: Requires 'S' in rights
  const canSee = hasRight(CBS_RECORD_FUNCTIONS.SEE);

  // 2. Can Input / Amend:
  // - Requires 'I' in profile
  // - Allowed on uncommitted drafts or existing records not in final archived state
  const canInput = hasRight(CBS_RECORD_FUNCTIONS.INPUT);
  const canAmend = hasRight(CBS_RECORD_FUNCTIONS.INPUT);

  // 3. Can Delete:
  // - Requires 'D' in profile
  // - Can only delete pending uncommitted drafts (status INA or NEW), cannot delete live AU records
  const canDelete =
    hasRight(CBS_RECORD_FUNCTIONS.DELETE) &&
    !isIdle &&
    (cleanStatus === "INA" || cleanStatus === "NEW" || !cleanStatus);

  // 4. Can Hold:
  // - Requires 'I' or 'H'
  // - Can only hold uncommitted or pending drafts
  const canHold =
    (hasRight(CBS_RECORD_FUNCTIONS.HISTORY) || hasRight(CBS_RECORD_FUNCTIONS.INPUT)) &&
    !isIdle &&
    cleanStatus !== "AU";

  // 5. Can Authorize:
  // - Requires 'A' in profile
  // - Record must be pending approval (status INA)
  // - Must NOT violate Four-Eyes
  const canAuthorize =
    hasRight(CBS_RECORD_FUNCTIONS.AUTHORIZE) &&
    !isIdle &&
    cleanStatus === "INA" &&
    !isFourEyesViolation;

  // 6. Can Reverse:
  // - Requires 'R' in profile
  // - Record must be live authorized (status AU)
  const canReverse = hasRight(CBS_RECORD_FUNCTIONS.REVERSE) && !isIdle && cleanStatus === "AU";

  // 7. Can History:
  // - Requires 'H' in profile
  const canHistory = hasRight(CBS_RECORD_FUNCTIONS.HISTORY);

  // 8. Can List / Directory:
  // - Requires 'L' in profile (defaults true if full access or explicitly granted)
  const canList = hasRight(CBS_RECORD_FUNCTIONS.LIST);

  // 9. Screen Read-Only state:
  // If in View mode ("S", "H") or user lacks 'I' rights, screen is locked
  const isReadOnly =
    mode === CBS_RECORD_FUNCTIONS.SEE ||
    mode === CBS_RECORD_FUNCTIONS.HISTORY ||
    mode === CBS_RECORD_FUNCTIONS.AUTHORIZE ||
    mode === CBS_RECORD_FUNCTIONS.DELETE ||
    mode === CBS_RECORD_FUNCTIONS.REVERSE ||
    !canInput;

  const getDisableReason = (action: CbsRecordFunction): string | null => {
    if (!hasRight(action)) {
      return `Access Denied: Missing '${action}' capability in user profile.`;
    }

    if (action === CBS_RECORD_FUNCTIONS.AUTHORIZE) {
      if (isFourEyesViolation) {
        return "Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction.";
      }
      if (cleanStatus && cleanStatus !== "INA") {
        return `Cannot Authorize: Record status is '${cleanStatus}' (must be pending 'INA').`;
      }
    }

    if (action === CBS_RECORD_FUNCTIONS.DELETE) {
      if (cleanStatus === "AU") {
        return "Cannot Delete: Record is already authorized. Use Reverse ('R') instead.";
      }
    }

    if (action === CBS_RECORD_FUNCTIONS.REVERSE) {
      if (cleanStatus !== "AU") {
        return `Cannot Reverse: Record status is '${cleanStatus}' (must be live 'AU').`;
      }
    }

    if (action === CBS_RECORD_FUNCTIONS.INPUT && isReadOnly) {
      return "Screen is in Read-Only mode.";
    }

    return null;
  };

  return {
    hasFunctionRight: hasRight,
    canSee,
    canInput,
    canAmend,
    canDelete,
    canHold,
    canAuthorize,
    canReverse,
    canHistory,
    canList,
    isReadOnly,
    isFourEyesViolation,
    getDisableReason,
    grantedRights,
  };
}
