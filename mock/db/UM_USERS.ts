import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

/**
 * UmUsersRecord: Canonical database table schema for UM_USERS (matching SC_MODEL_CONFIG USERS).
 */
export interface UmUsersRecord {
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
  password?: string[];
  overrideClass?: string[];
  dealerDesk?: string;
  maxSessions?: number;
  attributes?: string[];
  dispoOfficer?: string;
  dispoRights?: string;
  allowedDays?: string[];
  dateFormat?: string;
  empBankId?: string;
  mobileNumber?: string;
  email?: string;
  auditData?: AuditData;
}

/**
 * UM_USERS Table Master (PREFIX: UM, TABLE: USERS)
 * Holds Core Banking Security / User Profile management records.
 */
export const UM_USERS: Record<string, UmUsersRecord> = {
  ZZ0284590: {
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
    empBankId: "028459",
    mobileNumber: "01711000000",
    email: "bappy@janatabank.gov.bd",
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
  AD0284590: {
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
    empBankId: "000001",
    mobileNumber: "01819000000",
    email: "sysadmin@janatabank.gov.bd",
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
  AH0028140: {
    userName: "MOHAMMAD ANIS",
    signOnName: "AH002814",
    companyCode: ["JB9999"],
    passwordValidity: "2026-11-15",
    startDateProfile: "2026-10-15",
    endDateProfile: "2029-10-15",
    startTime: "00:00:00",
    endTime: "23:59:00",
    timeOutMinutes: 5,
    attempts: 3,
    empBankId: "002814",
    mobileNumber: "01313037872",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSUSER",
      recInputTime: "2026-10-15 06:27:34",
      recAuthorizer: "SYSUSER",
      recAuthTime: "2026-10-15 06:27:55",
      recBranchCode: "JB9999",
    },
  },
  AH0035920: {
    userName: "SHARMIN AKTER",
    signOnName: "AH003592",
    classification: "OFFICER",
    language: 1,
    companyCode: ["JB9999", "JB0001"],
    departmentCode: 102,
    passwordValidity: "2026-12-31",
    startDateProfile: "2026-10-15",
    endDateProfile: "2029-10-15",
    startTime: "09:00:00",
    endTime: "18:00:00",
    timeOutMinutes: 15,
    attempts: 0,
    overrideClass: ["L1"],
    maxSessions: 1,
    allowedDays: ["SUN", "MON", "TUE", "WED", "THU"],
    dateFormat: "DD/MM/YYYY",
    empBankId: "003592",
    mobileNumber: "01712349876",
    email: "sharmin.akter@janatabank.gov.bd",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSUSER",
      recInputTime: "2026-10-16 08:30:10",
      recAuthorizer: "SYSUSER",
      recAuthTime: "2026-10-16 08:35:00",
      recBranchCode: "JB9999",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const UM_USERS_INAU: Record<string, UmUsersRecord> = {
  AH0055210: {
    userName: "KAMAL HOSSAIN",
    signOnName: "AH005521",
    classification: "TELLER",
    language: 1,
    companyCode: ["JB9999"],
    departmentCode: 105,
    passwordValidity: "2026-12-15",
    startDateProfile: "2026-10-20",
    endDateProfile: "2029-10-20",
    startTime: "09:00:00",
    endTime: "17:00:00",
    timeOutMinutes: 10,
    attempts: 0,
    empBankId: "005521",
    mobileNumber: "01911998877",
    email: "kamal.hossain@janatabank.gov.bd",
    auditData: {
      recStatus: "INA",
      recCurrNumber: 1,
      recInputter: "IA0245820",
      recInputTime: "2026-10-20 11:15:00",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB9999",
    },
  },
};

export const UM_USERS_HIS: Record<string, UmUsersRecord[]> = {};
export const UM_USERS_DEL: Record<string, UmUsersRecord> = {};

export const UM_USERS_TABLE: CbsVersionedTable<UmUsersRecord> = {
  LIVE: UM_USERS,
  INAU: UM_USERS_INAU,
  HIS: UM_USERS_HIS,
  DEL: UM_USERS_DEL,
};

export const UM_USERS_LIST: UmUsersRecord[] = Object.values(UM_USERS);
