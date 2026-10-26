import type { BranchRecord } from "@/lib/data-schemas/branch-schema";
import type { CbsVersionedTable } from "./types";

/**
 * SC_BRANCH Database Table (PREFIX: SC, TABLE: BRANCH)
 * Holds Core Banking Branch Master records.
 */
export const SC_BRANCH: Record<string, BranchRecord> = {
  JB0001: {
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2025-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2025-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
    branchTitle: "IMAMGONJ CORPORATE  ",
    branchType: "BR",
    branchContact: [
      {
        addressLine: null,
        email: null,
        phone: null,
      },
    ],
    openDate: "20250101",
    isActive: true,
    bbCode: "0373",
    divCode: "7001",
    areaCode: "5035",
    gradeCode: "01",
    countryCode: "BD",
    routingNumber: "135272837",
    swiftCode: "JANBBDDHIMA ",
    parentBranch: "",
  },
  JB0002: {
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2025-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2025-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
    branchTitle: "LALDIGHI EAST CORP. ",
    branchType: "BR",
    branchContact: [
      {
        addressLine: null,
        email: null,
        phone: null,
      },
    ],
    openDate: "20250101",
    isActive: true,
    bbCode: "0083",
    divCode: "7003",
    areaCode: "5020",
    gradeCode: "01",
    countryCode: "BD",
    routingNumber: "135154542",
    swiftCode: "JANBBDDHLDE ",
    parentBranch: "",
  },
  JB0003: {
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2025-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2025-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
    branchTitle: "NETAIGONJ CORP.  ",
    branchType: "BR",
    branchContact: [
      {
        addressLine: null,
        email: null,
        phone: null,
      },
    ],
    openDate: "20250101",
    isActive: true,
    bbCode: "0570",
    divCode: "7001",
    areaCode: "5025",
    gradeCode: "02",
    countryCode: "BD",
    routingNumber: "135671270",
    swiftCode: "JANBBDDHNGN ",
    parentBranch: "",
  },
  JB0004: {
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2025-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2025-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
    branchTitle: "KHULNA CORP. ",
    branchType: "BR",
    branchContact: [
      {
        addressLine: null,
        email: null,
        phone: null,
      },
    ],
    openDate: "20250101",
    isActive: true,
    bbCode: "0794",
    divCode: "7004",
    areaCode: "5073",
    gradeCode: "01",
    countryCode: "BD",
    routingNumber: "135471759",
    swiftCode: "JANBBDDHKDA ",
    parentBranch: "",
  },
  JB0005: {
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2025-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2025-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
    branchTitle: "RAMNA CORP.  ",
    branchType: "BR",
    branchContact: [
      {
        addressLine: null,
        email: null,
        phone: null,
      },
    ],
    openDate: "20250101",
    isActive: true,
    bbCode: "0407",
    divCode: "7002",
    areaCode: "5057",
    gradeCode: "01",
    countryCode: "BD",
    routingNumber: "135275713",
    swiftCode: "JANBBDDHJRD ",
    parentBranch: "",
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const SC_BRANCH_INAU: Record<string, BranchRecord> = {};
export const SC_BRANCH_HIS: Record<string, BranchRecord[]> = {};
export const SC_BRANCH_DEL: Record<string, BranchRecord> = {};

export const SC_BRANCH_TABLE: CbsVersionedTable<BranchRecord> = {
  LIVE: SC_BRANCH,
  INAU: SC_BRANCH_INAU,
  HIS: SC_BRANCH_HIS,
  DEL: SC_BRANCH_DEL,
};

export const SC_BRANCH_LIST: BranchRecord[] = Object.values(SC_BRANCH);
