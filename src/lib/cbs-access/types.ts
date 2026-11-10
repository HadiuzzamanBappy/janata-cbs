import type {
  CbsRecordFunction,
  CbsRecordLifecycleStatus,
  CbsScreenMode,
  CbsUserSecurityContext,
} from "@/types";

/**
 * Universal context for evaluating CBS access rights, screen modes, and Four-Eyes compliance.
 */
export interface CbsAccessContext {
  /** User security profile or session context */
  readonly user?: CbsUserSecurityContext | null;
  /** Active user ID (defaults to user.userId; used for Four-Eyes verification) */
  readonly userId?: string;
  /** Function code rights (e.g. ['R', 'I', 'D', 'A', 'S', 'H', 'L']) */
  readonly grantedRights?: readonly string[];
  /** Lifecycle status of the current record (e.g. "INA", "AU", "HLD") */
  readonly recordStatus?: CbsRecordLifecycleStatus | string;
  /** User ID of the record creator/maker (used for Four-Eyes verification) */
  readonly recordInputter?: string;
  /** Current screen display mode */
  readonly mode?: CbsScreenMode;
}

/**
 * Evaluated access capabilities, UI flags, and compliance checks for the current session and record.
 */
export interface CbsAccessResult {
  /** Checks if the user holds a specific function code right */
  readonly hasFunctionRight: (code: CbsRecordFunction) => boolean;

  readonly canSee: boolean;
  readonly canInput: boolean;
  readonly canDelete: boolean;
  readonly canHold: boolean;
  readonly canAuthorize: boolean;
  readonly canReverse: boolean;
  readonly canList: boolean;

  /** True if the screen inputs should be disabled / read-only */
  readonly isReadOnly: boolean;

  /** True if Maker and Checker are the same user (violating Four-Eyes principle) */
  readonly isFourEyesViolation: boolean;

  /** Returns user-facing reason why a specific action is disabled, or null if enabled */
  readonly getDisableReason: (action: CbsRecordFunction) => string | null;

  /** All granted function code rights for the active user */
  readonly grantedRights: readonly CbsRecordFunction[];
}
