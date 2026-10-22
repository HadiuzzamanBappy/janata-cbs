/**
 * Canonical CBS Record Lifecycle & Ledger Statuses
 */

/**
 * Chronological record lifecycle statuses in Core Banking:
 *  - NEW: Uncommitted newly created draft
 *  - INA: Input Not Authorized (pending Maker-Checker approval in $NAU)
 *  - AU:  Authorized / Live ledger record
 *  - HLD: Held / Parked draft
 *  - REV: Reversed accounting transaction
 *  - DEL: Deleted draft
 */
export const CbsRecordStatus = {
  NEW: "NEW",
  INA: "INA",
  AU: "AU",
  HLD: "HLD",
  REV: "REV",
  DEL: "DEL",
} as const;

export type CbsRecordLifecycleStatus = (typeof CbsRecordStatus)[keyof typeof CbsRecordStatus];
export const CBS_RECORD_STATUSES = Object.values(CbsRecordStatus);

export interface CbsRecordStatusDefinition {
  readonly code: CbsRecordLifecycleStatus;
  readonly description: string;
  readonly label: string;
  readonly variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export const CBS_RECORD_STATUS_DEFINITIONS = {
  [CbsRecordStatus.NEW]: {
    code: CbsRecordStatus.NEW,
    description: "Newly initialized uncommitted record",
    label: "New Draft",
    variant: "outline",
  },
  [CbsRecordStatus.INA]: {
    code: CbsRecordStatus.INA,
    description: "Input Not Authorized (awaiting Checker approval in $NAU)",
    label: "Pending Approval",
    variant: "secondary",
  },
  [CbsRecordStatus.AU]: {
    code: CbsRecordStatus.AU,
    description: "Live authorized ledger record",
    label: "Authorized",
    variant: "success",
  },
  [CbsRecordStatus.HLD]: {
    code: CbsRecordStatus.HLD,
    description: "Parked / held draft pending completion",
    label: "Held",
    variant: "warning",
  },
  [CbsRecordStatus.REV]: {
    code: CbsRecordStatus.REV,
    description: "Reversed accounting transaction",
    label: "Reversed",
    variant: "destructive",
  },
  [CbsRecordStatus.DEL]: {
    code: CbsRecordStatus.DEL,
    description: "Deleted unauthorized draft",
    label: "Deleted",
    variant: "destructive",
  },
} as const satisfies Record<CbsRecordLifecycleStatus, CbsRecordStatusDefinition>;
