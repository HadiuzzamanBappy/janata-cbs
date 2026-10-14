import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";

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

export const SYS_USER_TABLE = SYS_USER_LIVE;
export const SYS_USER_LIST: UserRecord[] = Object.values(SYS_USER_LIVE);

export function getUserRecord(signonOrUserId: string): UserRecord | null {
  const clean = signonOrUserId.trim().toUpperCase();
  if (SYS_USER_LIVE[clean]) return SYS_USER_LIVE[clean];
  const byUserId = SYS_USER_LIST.find((u) => u.userId.toUpperCase() === clean);
  return byUserId ?? null;
}

/**
 * Builds the dynamic runtime authentication response expected by auth-parser and session layer.
 * Injects token, txnDate (bank working date), and authenticated status on top of table record.
 */
export function buildMockUserAuthResponse(user: UserRecord): GrpcResponse {
  const today = new Date().toISOString().split("T")[0];

  return {
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "User authenticated successfully",
    errors: [],
    timestamp: new Date().toISOString(),
    data: {
      userId: user.userId,
      fullName: user.fullName,
      accessibility: user.accessibility,
      userRole: user.userRole,
      commandLine: user.commandLine,
      branchName: user.branchName,
      branchCode: user.branchCode,
      txnDate: today,
      userStatus: user.userStatus,
      authenticated: true,
      token: `mock_jwt_token_${user.userId}_${Date.now()}`,
    },
  };
}

/**
 * Static response dictionary for auth endpoints.
 */
export const STATIC_USER_RESPONSES: Record<string, GrpcResponse> = Object.fromEntries(
  Object.entries(SYS_USER_LIVE).map(([signon, user]) => [signon, buildMockUserAuthResponse(user)]),
);
