import type { RawControlRecord } from "@/lib/data-schemas/control-schema";
import type { CbsVersionedTable } from "./types";

/* -------------------------------------------------------------------------- */
/* SC_CONTROL$LIVE (Authorized Production Control Master)                     */
/* -------------------------------------------------------------------------- */

export const SC_CONTROL_LIVE: Record<string, RawControlRecord> = {
  "AC.GROUP.ID": {
    recordId: "AC.GROUP.ID",
    controlName: "AC.GROUP.ID",
    description: "Account Group ID",
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
  ACCOUNT: {
    recordId: "ACCOUNT",
    controlName: "ACCOUNT",
    description: "Account Master",
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
  "ACCOUNT.ENTRY": {
    recordId: "ACCOUNT.ENTRY",
    controlName: "ACCOUNT.ENTRY",
    description: "Accounting Entry",
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
  AE: {
    recordId: "AE",
    controlName: "ACCOUNT.ENTRY",
    description: "Accounting Entry (Alias)",
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
  "BANK.DATE": {
    recordId: "BANK.DATE",
    controlName: "BANK.DATE",
    description: "Bank Working Date",
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
    recordId: "BRANCH",
    controlName: "BRANCH",
    description: "Branch Management",
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
  "CASH.TRANSFER": {
    recordId: "CASH.TRANSFER",
    controlName: "CASH.TRANSFER",
    description: "Cash Transfer Operations",
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
  CATEGORY: {
    recordId: "CATEGORY",
    controlName: "CATEGORY",
    description: "General Ledger Category",
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
  "CLIENT.ACTIVITY": {
    recordId: "CLIENT.ACTIVITY",
    controlName: "CLIENT.ACTIVITY",
    description: "Client Activity Log",
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "ADMIN02",
      recInputTime: "2026-07-21 06:29:03",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-07-21 06:30:00",
      recBranchCode: "JB9999",
    },
  },
  CMD: {
    recordId: "CMD",
    controlName: "SC.CONTROL.LIST",
    description: "Command Control Catalog",
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
  "SC.MODEL.CONFIG": {
    recordId: "SC.MODEL.CONFIG",
    controlName: "SC.MODEL.CONFIG",
    description: "Data Dictionary Metamodel Catalog",
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
  "SC.FORM.CONFIG": {
    recordId: "SC.FORM.CONFIG",
    controlName: "SC.FORM.CONFIG",
    description: "Dynamic Form Layout Designer",
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
  "SC.INQUIRY.CONFIG": {
    recordId: "SC.INQUIRY.CONFIG",
    controlName: "SC.INQUIRY.CONFIG",
    description: "Dynamic Inquiry Layout Designer",
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
  MENU: {
    recordId: "MENU",
    controlName: "MENU",
    description: "System Navigation Menu Catalog",
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
  "MENU.DESIGN": {
    recordId: "MENU.DESIGN",
    controlName: "MENU.DESIGN",
    description: "Menu Hierarchy Navigation Tree Designer",
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
  "USER.GROUP": {
    recordId: "USER.GROUP",
    controlName: "USER.GROUP",
    description: "User Group Roles & Security Entitlements",
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

export const SC_CONTROL_INAU: Record<string, RawControlRecord> = {
  "LOAN.DISBURSE": {
    recordId: "LOAN.DISBURSE",
    controlName: "LOAN.DISBURSE",
    description: "Retail Loan Instant Disbursement Facility",
    auditData: {
      recStatus: "INAU",
      recCurrNumber: 1,
      recInputter: "MAKER01",
      recInputTime: "2026-10-15 01:20:00",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB1001",
    },
  },
  "CARD.ISSUE": {
    recordId: "CARD.ISSUE",
    controlName: "CARD.ISSUE",
    description: "Debit & Credit Card Batch Issuance",
    auditData: {
      recStatus: "INAU",
      recCurrNumber: 1,
      recInputter: "MAKER02",
      recInputTime: "2026-10-15 01:25:00",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB1001",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* SC_CONTROL$HIS (Historical Audit Trail Snapshots)                          */
/* -------------------------------------------------------------------------- */

export const SC_CONTROL_HIS: Record<string, RawControlRecord[]> = {
  ACCOUNT: [
    {
      recordId: "ACCOUNT;1",
      controlName: "ACCOUNT",
      description: "Account Initial Setup",
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

export const SC_CONTROL_DEL: Record<string, RawControlRecord> = {
  "LEGACY.TELLER": {
    recordId: "LEGACY.TELLER",
    controlName: "LEGACY.TELLER",
    description: "Deprecated Terminal Cash Teller Interface",
    auditData: {
      recStatus: "DEL",
      recCurrNumber: 2,
      recInputter: "SYSADMIN",
      recInputTime: "2026-06-01 12:00:00",
      recAuthorizer: "CHIEF_AUDITOR",
      recAuthTime: "2026-06-01 12:15:00",
      recBranchCode: "JB9999",
    },
  },
};

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
