import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

/**
 * UsersRecord: The canonical database table schema for UM_USERS (matching SC_MODEL_CONFIG USERS).
 */
export interface UmUsersRecord {
  recordId?: string;
  userName: string;
  signOnName: string;
  classification?: string | null;
  language?: number | null;
  companyCode?: string[] | null;
  departmentCode?: number | null;
  passwordValidity?: string | null;
  startDateProfile?: string | null;
  endDateProfile?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  timeOutMinutes?: number | null;
  attempts?: number | null;
  initApplication?: string | null;
  customer?: string[] | null;
  account?: string[] | null;
  companyRestr?: string[] | null;
  application?: string[] | null;
  version?: string[] | null;
  function?: string[] | null;
  fieldNo?: string[] | null;
  dataComparison?: string[] | null;
  dataFrom?: string[] | null;
  dataTo?: string[] | null;
  signOnOffLog?: string | null;
  securityMgmtL?: string | null;
  applicationLog?: string | null;
  functionIdLog?: string | null;
  inputDayMonth?: string | null;
  attemptsSince?: string | null;
  dateLastSignOn?: string | null;
  timeLastSignOn?: string | null;
  password?: string[] | null;
  passwChangeDate?: string | null;
  passwEndDate?: string | null;
  deactivationDate?: string | null;
  reactivationDate?: string | null;
  clearScreen?: string | null;
  overrideClass?: string[] | null;
  dealerDesk?: string | null;
  printerForRpts?: string | null;
  printerForPFunc?: string | null;
  userAddr?: string[] | null;
  rptToReceive?: string[] | null;
  rptCopies?: string[] | null;
  lastSpoolDate?: string[] | null;
  lastSpoolTime?: string[] | null;
  amountFormat?: string | null;
  maxSessions?: number | null;
  attributes?: string[] | null;
  dispoOfficer?: string | null;
  signOnItem?: string[] | null;
  signOffItem?: string | null;
  processDept?: string[] | null;
  oc1?: string | null;
  othBookAccess?: string[] | null;
  othBookBlock?: string[] | null;
  dispoRights?: string[] | null;
  allowedDays?: string[] | null;
  dayStTime?: string[] | null;
  dayEndTime?: string[] | null;
  ldapId?: string | null;
  ldapDn?: string | null;
  leadPref?: string | null;
  dateFormat?: string | null;
  offlineSmsProfile?: string | null;
  signOnRtn?: string | null;
  empBankId?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  tDate?: string | null;
  tTime?: string | null;
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
  AH002814: {
    userName: "MOHAMMAD ANIS",
    signOnName: "AH002814",
    classification: null,
    language: null,
    companyCode: ["JB9999"],
    departmentCode: null,
    passwordValidity: "2026-11-15",
    startDateProfile: "2026-10-15",
    endDateProfile: "2029-10-15",
    startTime: "00:00:00",
    endTime: "23:59:00",
    timeOutMinutes: 5,
    attempts: 3,
    initApplication: null,
    customer: null,
    account: null,
    companyRestr: null,
    application: null,
    version: null,
    function: null,
    fieldNo: null,
    dataComparison: null,
    dataFrom: null,
    dataTo: null,
    signOnOffLog: null,
    securityMgmtL: null,
    applicationLog: null,
    functionIdLog: null,
    inputDayMonth: null,
    attemptsSince: null,
    dateLastSignOn: null,
    timeLastSignOn: null,
    password: null,
    passwChangeDate: null,
    passwEndDate: null,
    deactivationDate: null,
    reactivationDate: null,
    clearScreen: null,
    overrideClass: null,
    dealerDesk: null,
    printerForRpts: null,
    printerForPFunc: null,
    userAddr: null,
    rptToReceive: null,
    rptCopies: null,
    lastSpoolDate: null,
    lastSpoolTime: null,
    amountFormat: null,
    maxSessions: null,
    attributes: null,
    dispoOfficer: null,
    signOnItem: null,
    signOffItem: null,
    processDept: null,
    oc1: null,
    othBookAccess: null,
    othBookBlock: null,
    dispoRights: null,
    allowedDays: null,
    dayStTime: null,
    dayEndTime: null,
    ldapId: null,
    ldapDn: null,
    leadPref: null,
    dateFormat: null,
    offlineSmsProfile: null,
    signOnRtn: null,
    empBankId: "002814",
    mobileNumber: "01313037872",
    email: "",
    tDate: null,
    tTime: null,
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
  AH003592: {
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
    initApplication: null,
    customer: null,
    account: null,
    companyRestr: null,
    application: null,
    version: null,
    function: null,
    fieldNo: null,
    dataComparison: null,
    dataFrom: null,
    dataTo: null,
    signOnOffLog: null,
    securityMgmtL: null,
    applicationLog: null,
    functionIdLog: null,
    inputDayMonth: null,
    attemptsSince: null,
    dateLastSignOn: null,
    timeLastSignOn: null,
    password: null,
    passwChangeDate: null,
    passwEndDate: null,
    deactivationDate: null,
    reactivationDate: null,
    clearScreen: null,
    overrideClass: ["L1"],
    dealerDesk: null,
    printerForRpts: null,
    printerForPFunc: null,
    userAddr: null,
    rptToReceive: null,
    rptCopies: null,
    lastSpoolDate: null,
    lastSpoolTime: null,
    amountFormat: null,
    maxSessions: 1,
    attributes: null,
    dispoOfficer: null,
    signOnItem: null,
    signOffItem: null,
    processDept: null,
    oc1: null,
    othBookAccess: null,
    othBookBlock: null,
    dispoRights: null,
    allowedDays: ["SUN", "MON", "TUE", "WED", "THU"],
    dayStTime: null,
    dayEndTime: null,
    ldapId: null,
    ldapDn: null,
    leadPref: null,
    dateFormat: "DD/MM/YYYY",
    offlineSmsProfile: null,
    signOnRtn: null,
    empBankId: "003592",
    mobileNumber: "01712349876",
    email: "sharmin.akter@janatabank.gov.bd",
    tDate: null,
    tTime: null,
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
  AH005521: {
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
    initApplication: null,
    customer: null,
    account: null,
    companyRestr: null,
    application: null,
    version: null,
    function: null,
    fieldNo: null,
    dataComparison: null,
    dataFrom: null,
    dataTo: null,
    signOnOffLog: null,
    securityMgmtL: null,
    applicationLog: null,
    functionIdLog: null,
    inputDayMonth: null,
    attemptsSince: null,
    dateLastSignOn: null,
    timeLastSignOn: null,
    password: null,
    passwChangeDate: null,
    passwEndDate: null,
    deactivationDate: null,
    reactivationDate: null,
    clearScreen: null,
    overrideClass: null,
    dealerDesk: null,
    printerForRpts: null,
    printerForPFunc: null,
    userAddr: null,
    rptToReceive: null,
    rptCopies: null,
    lastSpoolDate: null,
    lastSpoolTime: null,
    amountFormat: null,
    maxSessions: null,
    attributes: null,
    dispoOfficer: null,
    signOnItem: null,
    signOffItem: null,
    processDept: null,
    oc1: null,
    othBookAccess: null,
    othBookBlock: null,
    dispoRights: null,
    allowedDays: null,
    dayStTime: null,
    dayEndTime: null,
    ldapId: null,
    ldapDn: null,
    leadPref: null,
    dateFormat: null,
    offlineSmsProfile: null,
    signOnRtn: null,
    empBankId: "005521",
    mobileNumber: "01911998877",
    email: "kamal.hossain@janatabank.gov.bd",
    tDate: null,
    tTime: null,
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
