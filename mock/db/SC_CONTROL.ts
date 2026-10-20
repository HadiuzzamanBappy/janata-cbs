import type { RawControlRecord } from "@/lib/data-schemas/control-schema";
import type { CbsVersionedTable } from "./types";

/* -------------------------------------------------------------------------- */
/* SC_CONTROL$LIVE (Authorized Production Control Master)                     */
/* Strictly contains non-system business application controls                 */
/* (System administrative canvases are declared in catalog.ts)                */
/* Key is the canonical control record ID; inline recordId is omitted         */
/* -------------------------------------------------------------------------- */

export const SC_CONTROL_LIVE: Record<string, RawControlRecord> = {
  ACCOUNT: {
    command: "ACCOUNT",
    title: "Account Master",
    aliases: ["AC"],
    actionType: "SCREEN",
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 00:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 00:05:00",
      recBranchCode: "JB9999",
    },
  },
  BRANCH: {
    command: "BRANCH",
    title: "Branch Management",
    aliases: ["BR"],
    actionType: "SCREEN",
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 00:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 00:05:00",
      recBranchCode: "JB9999",
    },
  },
  CONTROL: {
    command: "CONTROL",
    title: "Control Table Master",
    aliases: ["CMD"],
    actionType: "SCREEN",
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 00:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 00:05:00",
      recBranchCode: "JB9999",
    },
  },
  CUSTOMER: {
    command: "CUSTOMER",
    title: "Customer Master",
    aliases: ["CUST"],
    actionType: "SCREEN",
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 00:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 00:05:00",
      recBranchCode: "JB9999",
    },
  },
  USER: {
    command: "USER",
    title: "User Management",
    aliases: ["USR"],
    actionType: "SCREEN",
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 00:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 00:05:00",
      recBranchCode: "JB9999",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* SC_CONTROL$NAU / $INAU (Input / Unauthorized Records)                      */
/* -------------------------------------------------------------------------- */

export const SC_CONTROL_INAU: Record<string, RawControlRecord> = {};

/* -------------------------------------------------------------------------- */
/* SC_CONTROL$HIS (Historical Audit Trail Snapshots)                          */
/* -------------------------------------------------------------------------- */

export const SC_CONTROL_HIS: Record<string, RawControlRecord[]> = {
  ACCOUNT: [
    {
      command: "ACCOUNT",
      title: "Account Initial Setup",
      aliases: ["AC"],
      actionType: "SCREEN",
      auditData: {
        recStatus: "LIVE",
        recCurrNumber: 1,
        recInputter: "SYSTEM",
        recInputTime: "2025-01-01 00:00:00",
        recAuthorizer: "SYSTEM",
        recAuthTime: "2025-01-01 00:05:00",
        recBranchCode: "JB9999",
      },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* SC_CONTROL$DEL (Reversed / Soft-Deleted Controls)                          */
/* -------------------------------------------------------------------------- */

export const SC_CONTROL_DEL: Record<string, RawControlRecord> = {};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Bundle                                                 */
/* -------------------------------------------------------------------------- */

export const SC_CONTROL_TABLE: CbsVersionedTable<RawControlRecord> = {
  LIVE: SC_CONTROL_LIVE,
  INAU: SC_CONTROL_INAU,
  HIS: SC_CONTROL_HIS,
  DEL: SC_CONTROL_DEL,
};

export const SC_CONTROL_LIST: RawControlRecord[] = Object.values(SC_CONTROL_LIVE);
