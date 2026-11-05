import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

/**
 * UsersRecord: The canonical database table schema for UM_USERS (matching SC_MODEL_CONFIG USERS).
 */
export interface UmUsersRecord {
  recordId?: string;
  userName: string;
  signOnName: string;
  classification?: string;
  language?: number;
  companyCode?: string[];
  departmentCode?: number;
  passwordValidity?: string;
  startDateProfile?: string;
  endDateProfile?: string;
  startTime?: string;
  endTime?: string;
  timeOutMinutes?: number;
  attempts?: number;
  initApplication?: string;
  customer?: string[];
  account?: string[];
  companyRestr?: string[];
  application?: string[];
  version?: string[];
  function?: string[];
  fieldNo?: string[];
  dataComparison?: string[];
  dataFrom?: string[];
  dataTo?: string[];
  signOnOffLog?: string;
  securityMgmtL?: string;
  applicationLog?: string;
  functionIdLog?: string;
  inputDayMonth?: string;
  attemptsSince?: string;
  dateLastSignOn?: string;
  timeLastSignOn?: string;
  password?: string[];
  passwChangeDate?: string;
  passwEndDate?: string;
  deactivationDate?: string;
  reactivationDate?: string;
  clearScreen?: string;
  overrideClass?: string[];
  dealerDesk?: string;
  printerForRpts?: string;
  printerForPFunc?: string;
  userAddr?: string[];
  rptToReceive?: string[];
  rptCopies?: string[];
  lastSpoolDate?: string[];
  lastSpoolTime?: string[];
  amountFormat?: string;
  maxSessions?: number;
  attributes?: string[];
  dispoOfficer?: string;
  signOnItem?: string[];
  signOffItem?: string;
  processDept?: string[];
  oc1?: string;
  othBookAccess?: string[];
  othBookBlock?: string[];
  dispoRights?: string[];
  allowedDays?: string[];
  dayStTime?: string[];
  dayEndTime?: string[];
  ldapId?: string;
  ldapDn?: string;
  auditData?: AuditData;
}

/**
 * UM_USERS Table Master (PREFIX: UM, TABLE: USERS)
 * Holds Core Banking Security / User Profile management records.
 */
export const UM_USERS: Record<string, UmUsersRecord> = {
  ZZ028459: {
    userName: "MD. HADIUZZAMAN BAPPY",
    signOnName: "ZZ028459",
    classification: "OFFICER",
    language: 1,
    companyCode: ["JB9999", "JB1001"],
    departmentCode: 101,
    timeOutMinutes: 15,
    attempts: 0,
    startDateProfile: "2025-01-01",
    endDateProfile: "2030-12-31",
    startTime: "09:00",
    endTime: "18:00",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-19 10:00:00",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-01-19 10:05:00",
      recBranchCode: "JB9999",
    },
  },
  AD028459: {
    userName: "SYSTEM ADMINISTRATOR",
    signOnName: "AD028459",
    classification: "ADMIN",
    language: 1,
    companyCode: ["JB9999"],
    departmentCode: 999,
    timeOutMinutes: 30,
    attempts: 0,
    startDateProfile: "2025-01-01",
    endDateProfile: "2030-12-31",
    startTime: "00:00",
    endTime: "23:59",
    auditData: {
      recStatus: "AU",
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
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const UM_USERS_INAU: Record<string, UmUsersRecord> = {};
export const UM_USERS_HIS: Record<string, UmUsersRecord[]> = {};
export const UM_USERS_DEL: Record<string, UmUsersRecord> = {};

export const UM_USERS_TABLE: CbsVersionedTable<UmUsersRecord> = {
  LIVE: UM_USERS,
  INAU: UM_USERS_INAU,
  HIS: UM_USERS_HIS,
  DEL: UM_USERS_DEL,
};

export const UM_USERS_LIST: UmUsersRecord[] = Object.values(UM_USERS);
