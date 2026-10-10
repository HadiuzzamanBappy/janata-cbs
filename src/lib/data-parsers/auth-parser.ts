import type { CurrentUser } from "@/lib/data-schemas/auth-schema";
import { decodeProtobufValue } from "./protobuf-decoder";

export interface ParsedUserAuthResult {
  currUser: CurrentUser;
  token: string;
}

/**
 * Standard parser to map CBS authentication response payload into a CurrentUser domain session.
 * Executed identically for both live gRPC and static mock modes.
 */
export function parseAuthWirePayload(data: unknown, fallbackUsername = ""): ParsedUserAuthResult {
  const f = decodeProtobufValue<Record<string, unknown>>(data);

  const accessibility = String(f.accessibility || "FULL");

  const currUser: CurrentUser = {
    userId: String(f.userId || ""),
    fullName: String(f.fullName || fallbackUsername),
    branchCode: String(f.branchCode || "JB9999"),
    branchName: String(f.branchName || "Central Office"),
    txnDate: String(f.txnDate || "2026-01-07"),
    lastTxnDate: f.lastTxnDate ? String(f.lastTxnDate) : undefined,
    nextDate: f.nextDate ? String(f.nextDate) : undefined,
    userRole: Array.isArray(f.userRole) ? f.userRole.map(String) : [String(f.userRole || "USER")],
    accessibility,
    functionRights: accessibility
      ? accessibility.split("").filter(Boolean)
      : ["R", "I", "D", "A", "S", "H"],
    commandLine: Boolean(f.commandLine),
    initLogin: Boolean(f.initLogin),
    isLoggedIn: true,
    userStatus: typeof f.userStatus === "number" ? f.userStatus : 1,
  };

  return {
    currUser,
    token: String(f.token || ""),
  };
}
