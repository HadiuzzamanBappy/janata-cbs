import { decodeProtobufValue } from "./protobuf-decoder";
import type { CurrentUser } from "@/lib/redis";

export interface ParsedUserAuthResult {
  currUser: CurrentUser;
  token: string;
}

/**
 * Universal parser to extract and normalize a CBS authentication response payload
 * into a typed CurrentUser domain session and authorization token.
 * Executed identically for both live gRPC and static mock modes.
 */
export function parseAuthWirePayload(data: unknown, fallbackUsername = ""): ParsedUserAuthResult {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid authentication payload received from CBS");
  }

  const fields = decodeProtobufValue<Record<string, unknown>>(data);

  const userId = String(fields.userId || "").trim();
  const token = String(fields.token || "").trim();

  if (!token || !userId) {
    throw new Error("Login response missing required authentication token or userId");
  }

  const fullName = String(fields.fullName || fallbackUsername);
  const branchCode = String(fields.branchCode || "JB9999");
  const branchName = String(fields.branchName || "Central Office");
  const txnDate = String(fields.txnDate || new Date().toISOString().split("T")[0]);
  const accessibility = String(fields.accessibility || "FULL");
  const commandLine = Boolean(fields.commandLine);
  const initLogin = Boolean(fields.initLogin);
  const userStatus = typeof fields.userStatus === "number" ? fields.userStatus : 1;

  // Extract roles
  let userRole: string[] = [];
  const rawRole = fields.userRole;
  if (Array.isArray(rawRole)) {
    userRole = rawRole.map(String).filter((r) => r && r !== "NULL_VALUE");
  } else if (typeof rawRole === "string" && rawRole.trim() && rawRole !== "NULL_VALUE") {
    userRole = [rawRole.trim()];
  }


  // Extract CBS RIDASH function rights
  const functionRights = accessibility
    ? accessibility.split("").filter(Boolean)
    : ["R", "I", "D", "A", "S", "H"];

  const currUser: CurrentUser = {
    userId,
    fullName: fullName.trim(),
    branchCode: branchCode.trim(),
    branchName: branchName.trim(),
    txnDate: txnDate.trim(),
    userRole,
    accessibility,
    functionRights,
    commandLine,
    initLogin,
    isLoggedIn: true,
    userStatus,
  };

  return { currUser, token };
}
