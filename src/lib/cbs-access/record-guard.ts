import type { CbsAccessContext, CbsAccessFunctionCode, CbsAccessResult } from "./types";

export interface EvaluateAccessParams extends CbsAccessContext {
  userId?: string;
  grantedRights: CbsAccessFunctionCode[];
}

/**
 * Pure, deterministic banking capability evaluator.
 * Cross-references User Rights with Record Status and Four-Eyes Maker-Checker compliance.
 */
export function evaluateCbsAccess({
  userId,
  grantedRights,
  recordStatus,
  recordInputter,
  mode = "IDLE",
}: EvaluateAccessParams): CbsAccessResult {
  const hasRight = (code: CbsAccessFunctionCode) => grantedRights.includes(code);

  const cleanStatus = (recordStatus || "").toUpperCase().trim();
  const isIdle = mode === "IDLE";

  // Four-Eyes Rule: If the record has an inputter, the Maker cannot act as the Authorizer (Checker)
  const isFourEyesViolation = Boolean(
    userId &&
      recordInputter &&
      userId.toUpperCase().trim() === recordInputter.toUpperCase().trim(),
  );

  // 1. Can See: Requires 'S' in rights
  const canSee = hasRight("S");

  // 2. Can Input / Amend:
  // - Requires 'I' in profile
  // - Allowed on uncommitted drafts or existing records not in final archived state
  const canInput = hasRight("I");
  const canAmend = hasRight("I") && !isIdle;

  // 3. Can Delete:
  // - Requires 'D' in profile
  // - Can only delete pending uncommitted drafts (status INA or NEW), cannot delete live AU records
  const canDelete = hasRight("D") && !isIdle && (cleanStatus === "INA" || cleanStatus === "NEW" || !cleanStatus);

  // 4. Can Hold:
  // - Requires 'I' or 'H'
  // - Can only hold uncommitted or pending drafts
  const canHold = (hasRight("H") || hasRight("I")) && !isIdle && cleanStatus !== "AU";

  // 5. Can Authorize:
  // - Requires 'A' in profile
  // - Record must be pending approval (status INA)
  // - Must NOT violate Four-Eyes
  const canAuthorize = hasRight("A") && !isIdle && cleanStatus === "INA" && !isFourEyesViolation;

  // 6. Can Reverse:
  // - Requires 'R' in profile
  // - Record must be live authorized (status AU)
  const canReverse = hasRight("R") && !isIdle && cleanStatus === "AU";

  // 7. Can History:
  // - Requires 'H' in profile
  const canHistory = hasRight("H");

  // 8. Screen Read-Only state:
  // If in View mode ("S", "H") or user lacks 'I' rights, screen is locked
  const isReadOnly = mode === "S" || mode === "H" || mode === "A" || mode === "D" || mode === "R" || !canInput;

  const getDisableReason = (action: CbsAccessFunctionCode): string | null => {
    if (!hasRight(action)) {
      return `Access Denied: Missing '${action}' capability in user profile.`;
    }

    if (action === "A") {
      if (isFourEyesViolation) {
        return "Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction.";
      }
      if (cleanStatus && cleanStatus !== "INA") {
        return `Cannot Authorize: Record status is '${cleanStatus}' (must be pending 'INA').`;
      }
    }

    if (action === "D") {
      if (cleanStatus === "AU") {
        return "Cannot Delete: Record is already authorized. Use Reverse ('R') instead.";
      }
    }

    if (action === "R") {
      if (cleanStatus !== "AU") {
        return `Cannot Reverse: Record status is '${cleanStatus}' (must be live 'AU').`;
      }
    }

    if (action === "I" && isReadOnly) {
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
    isReadOnly,
    isFourEyesViolation,
    getDisableReason,
    grantedRights,
  };
}
