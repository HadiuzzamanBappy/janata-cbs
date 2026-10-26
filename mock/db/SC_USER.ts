import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

/**
 * UserRecord: The canonical database table schema for SC_USER (matching SC_MODEL_CONFIG USER).
 */
export interface UserRecord {
  userId: string;
  fullName: string;
  userRole: string[];
  accessibility: string;
  branchCode: string;
  branchName: string;
  commandLine: boolean;
  userStatus: number;
  password?: string;
  auditData?: AuditData;
}

/**
 * SC_USER Table Master (PREFIX: SC, TABLE: USER)
 * Holds pure static database table records for operators/users.
 * Key is the canonical username / operator ID (entry ID).
 */
export const SC_USER: Record<string, UserRecord> = {
  ZZ028459: {
    userId: "ZZ0284590",
    fullName: "MD. HADIUZZAMAN BAPPY",
    accessibility: "RIDASHL",
    userRole: ["USER"],
    commandLine: true,
    branchName: "CENTRAL OFFICE, HO, DHAKA   ",
    branchCode: "JB9999",
    userStatus: 1,
    password: "password123",
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
  AD028459: {
    userId: "AD0284590",
    fullName: "System Administrator",
    accessibility: "RIDASHL",
    userRole: ["ADMIN"],
    commandLine: true,
    branchName: "CENTRAL OFFICE, HO, DHAKA   ",
    branchCode: "JB9999",
    userStatus: 1,
    password: "password123",
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
  ST028459: {
    userId: "ST0284590",
    fullName: "New Staff Member",
    accessibility: "RS",
    userRole: ["USER"],
    commandLine: false,
    branchName: "Gulshan Branch",
    branchCode: "JB1002",
    userStatus: 1,
    password: "password123",
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

export const SC_USER_INAU: Record<string, UserRecord> = {};
export const SC_USER_HIS: Record<string, UserRecord[]> = {};
export const SC_USER_DEL: Record<string, UserRecord> = {};

export const SC_USER_TABLE: CbsVersionedTable<UserRecord> = {
  LIVE: SC_USER,
  INAU: SC_USER_INAU,
  HIS: SC_USER_HIS,
  DEL: SC_USER_DEL,
};

export const SC_USER_LIST: UserRecord[] = Object.values(SC_USER);
