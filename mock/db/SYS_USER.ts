import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

/**
 * UserRecord: The real database table schema for SYS_USER (matching SC_MODEL_CONFIG USER).
 */
export interface UserRecord {
  recordId: string;
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
 * SYS_USER Table Master (PREFIX: SYS, TABLE: USER)
 * Holds pure static database table records for operators/users.
 */
export const SYS_USER_LIVE: Record<string, UserRecord> = {
  ZZ028459: {
    recordId: "ZZ028459",
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
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 00:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 00:05:00",
      recBranchCode: "JB9999",
    },
  },
  AD028459: {
    recordId: "AD028459",
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
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 00:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 00:05:00",
      recBranchCode: "JB9999",
    },
  },
  ST028459: {
    recordId: "ST028459",
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
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const SYS_USER_INAU: Record<string, UserRecord> = {};
export const SYS_USER_HIS: Record<string, UserRecord[]> = {};
export const SYS_USER_DEL: Record<string, UserRecord> = {};

export const SYS_USER_TABLE: CbsVersionedTable<UserRecord> = {
  LIVE: SYS_USER_LIVE,
  INAU: SYS_USER_INAU,
  HIS: SYS_USER_HIS,
  DEL: SYS_USER_DEL,
};

export const SYS_USER_LIST: UserRecord[] = Object.values(SYS_USER_LIVE);
