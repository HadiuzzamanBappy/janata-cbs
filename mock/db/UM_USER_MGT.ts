import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

/**
 * UmUserMgtRecord: The canonical database table schema for UM_USER_MGT (matching SC_MODEL_CONFIG USER.MGT).
 */
export interface UmUserMgtRecord {
  employeeName: string;
  placeOfPosting: string;
  userId: string;
  signOnName: string;
  userPassword?: string;
  tellerId?: number;
  userDesignation: string;
  empBankId: string;
  mobileNo: string;
  email: string;
  prlDate?: string;
  general?: string;
  teller?: string;
  oibta?: string;
  dispo?: string;
  bigFileUpload?: string;
  empRole?: string;
  requestFor: string;
  reqDescription?: string;
  requestReason?: string;
  requestStatus?: string;
  requestedBy?: string;
  approvedBy?: string;
  requestDateTime?: string;
  requestCoCode?: string;
  denyReason?: string;
  stopStartDate?: string;
  stopEndDate?: string;
  closeApplyDate?: string;
  transferredBranch?: string;
  clearing?: string;
  auditData?: AuditData;
}

/**
 * UM_USER_MGT Table Master (PREFIX: UM, TABLE: USER_MGT)
 * Live authorized user management profiles.
 */
export const UM_USER_MGT: Record<string, UmUserMgtRecord> = {
  UM00001: {
    employeeName: "TANVIR AHMED",
    placeOfPosting: "Principal Branch (JB0001)",
    userId: "ZZ019823",
    signOnName: "ZZ019823",
    userPassword: "******",
    tellerId: 102,
    userDesignation: "Senior Principal Officer",
    empBankId: "19823",
    mobileNo: "01711223344",
    email: "tanvir.ahmed@janatabank.gov.bd",
    prlDate: "2035-12-31",
    general: "Y",
    teller: "Y",
    oibta: "Y",
    dispo: "Y",
    bigFileUpload: "N",
    empRole: "BRANCH_MANAGER",
    requestFor: "NEW",
    reqDescription: "New user onboarding and branch head profile creation",
    requestReason: "Joining as Branch Head",
    requestStatus: "AUTH",
    requestedBy: "ADMIN02",
    approvedBy: "SYSADMIN",
    requestDateTime: "2026-08-02 09:30:06",
    requestCoCode: "JB0001",
    transferredBranch: "JB0001",
    clearing: "Y",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "ADMIN02",
      recInputTime: "2026-08-02 09:30:06",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-08-02 09:35:00",
      recBranchCode: "JB9999",
    },
  },
  UM00002: {
    employeeName: "NUSRAT JAHAN",
    placeOfPosting: "Dilkusha Corporate Branch (JB1001)",
    userId: "ZZ023451",
    signOnName: "ZZ023451",
    userPassword: "******",
    tellerId: 105,
    userDesignation: "Executive Officer",
    empBankId: "23451",
    mobileNo: "01819556677",
    email: "nusrat.jahan@janatabank.gov.bd",
    prlDate: "2042-06-30",
    general: "Y",
    teller: "Y",
    oibta: "N",
    dispo: "N",
    bigFileUpload: "N",
    empRole: "TELLER",
    requestFor: "NEW",
    reqDescription: "Cash counter teller role allocation",
    requestReason: "Branch internal rotation",
    requestStatus: "AUTH",
    requestedBy: "ADMIN02",
    approvedBy: "SYSADMIN",
    requestDateTime: "2026-09-15 11:20:00",
    requestCoCode: "JB1001",
    transferredBranch: "JB1001",
    clearing: "N",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "ADMIN02",
      recInputTime: "2026-09-15 11:20:00",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-09-15 11:25:00",
      recBranchCode: "JB9999",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const UM_USER_MGT_INAU: Record<string, UmUserMgtRecord> = {
  UM00003: {
    employeeName: "KAMRUL HASAN",
    placeOfPosting: "Motijheel Commercial Area Branch (JB0002)",
    userId: "ZZ031122",
    signOnName: "ZZ031122",
    userPassword: "******",
    tellerId: 108,
    userDesignation: "Senior Officer",
    empBankId: "31122",
    mobileNo: "01912345678",
    email: "kamrul.hasan@janatabank.gov.bd",
    prlDate: "2040-08-31",
    general: "Y",
    teller: "Y",
    oibta: "Y",
    dispo: "N",
    bigFileUpload: "N",
    empRole: "OFFICER",
    requestFor: "NEW",
    reqDescription: "Pending authorization for general banking maker",
    requestReason: "Annual deployment",
    requestStatus: "INAU",
    requestedBy: "IA0245820",
    requestDateTime: "2026-10-07 06:24:49",
    requestCoCode: "JB0002",
    transferredBranch: "JB0002",
    clearing: "Y",
    auditData: {
      recStatus: "INA",
      recCurrNumber: 1,
      recInputter: "IA0245820",
      recInputTime: "2026-10-07 06:24:49",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB9999",
    },
  },
  UM00004: {
    employeeName: "SHAHIN ALAM",
    placeOfPosting: "Gulshan Branch (JB0015)",
    userId: "ZZ044556",
    signOnName: "ZZ044556",
    userPassword: "******",
    tellerId: 112,
    userDesignation: "Principal Officer",
    empBankId: "44556",
    mobileNo: "01719876543",
    email: "shahin.alam@janatabank.gov.bd",
    prlDate: "2038-03-31",
    general: "Y",
    teller: "N",
    oibta: "Y",
    dispo: "Y",
    bigFileUpload: "Y",
    empRole: "SUPERVISOR",
    requestFor: "NEW",
    reqDescription: "Foreign exchange desk transfer request",
    requestReason: "Posting transfer",
    requestStatus: "INAU",
    requestedBy: "IA0245820",
    requestDateTime: "2026-10-08 09:15:30",
    requestCoCode: "JB0015",
    transferredBranch: "JB0015",
    clearing: "N",
    auditData: {
      recStatus: "INA",
      recCurrNumber: 1,
      recInputter: "IA0245820",
      recInputTime: "2026-10-08 09:15:30",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB9999",
    },
  },
};

export const UM_USER_MGT_HIS: Record<string, UmUserMgtRecord[]> = {};
export const UM_USER_MGT_DEL: Record<string, UmUserMgtRecord> = {};

export const UM_USER_MGT_TABLE: CbsVersionedTable<UmUserMgtRecord> = {
  LIVE: UM_USER_MGT,
  INAU: UM_USER_MGT_INAU,
  HIS: UM_USER_MGT_HIS,
  DEL: UM_USER_MGT_DEL,
};

export const UM_USER_MGT_LIST: UmUserMgtRecord[] = Object.values(UM_USER_MGT);
