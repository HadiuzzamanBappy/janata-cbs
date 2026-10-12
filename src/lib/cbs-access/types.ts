import type { CbsRecordFunction, CbsRecordLifecycleStatus } from "@/types";

export type { CbsRecordFunction, CbsRecordLifecycleStatus };

/* -------------------------------------------------------------------------- */
/* Access Evaluation Context & Parameter Contracts                           */
/* -------------------------------------------------------------------------- */

export interface CbsAccessUser {
  readonly userId?: string;
  readonly accessibility?: string | readonly string[];
  readonly functionRights?: readonly string[];
}

export interface CbsAccessContext {
  /** Optional user override to evaluate access without reading from adapter */
  readonly user?: CbsAccessUser | null;
  /** Screen command code (e.g. "CUSTOMER", "ACCOUNT", "MODEL.CONFIG") */
  readonly command?: string;
  /** Active record lifecycle status (INA, AU, HLD, etc.) */
  readonly recordStatus?: CbsRecordLifecycleStatus | string;
  /** Inputter/Maker user ID of the current record */
  readonly recordInputter?: string;
  /** Active screen display mode (IDLE, I, S, A, D, R, H) */
  readonly mode?: "IDLE" | CbsRecordFunction;
}

/* -------------------------------------------------------------------------- */
/* Access Capability Evaluation Result                                        */
/* -------------------------------------------------------------------------- */

export interface CbsAccessResult {
  /** Whether user has a specific function code right in their accessibility profile */
  readonly hasFunctionRight: (code: CbsRecordFunction) => boolean;

  /** Dynamic capability evaluations taking record state & Four-Eyes into account */
  readonly canSee: boolean;
  readonly canInput: boolean;
  readonly canAmend: boolean;
  readonly canDelete: boolean;
  readonly canHold: boolean;
  readonly canAuthorize: boolean;
  readonly canReverse: boolean;
  readonly canHistory: boolean;
  readonly canList: boolean;

  /** True if screen should be rendered read-only */
  readonly isReadOnly: boolean;

  /** True if Four-Eyes compliance is violated (Maker trying to authorize own record) */
  readonly isFourEyesViolation: boolean;

  /** Returns human-readable disabled explanation for tooltips */
  readonly getDisableReason: (action: CbsRecordFunction) => string | null;

  /** Raw parsed function rights array (e.g. ['R', 'I', 'D', 'A', 'S', 'H']) */
  readonly grantedRights: readonly CbsRecordFunction[];
}
