import { extractBooleanField, extractNumberField, extractStringField } from "@/lib/grpc/struct";
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

  const raw = data as Record<string, unknown>;
  const fields = (
    typeof raw === "object" && raw !== null && "fields" in raw
      ? (raw as { fields: Record<string, unknown> }).fields
      : raw
  ) as Record<string, unknown>;

  const userId = extractStringField(fields, "userId").trim();
  const token = extractStringField(fields, "token").trim();

  if (!token || !userId) {
    throw new Error("Login response missing required authentication token or userId");
  }

  const fullName = extractStringField(fields, "fullName") || fallbackUsername;
  const branchCode = extractStringField(fields, "branchCode") || "JB9999";
  const branchName = extractStringField(fields, "branchName") || "Central Office";
  const txnDate = extractStringField(fields, "txnDate") || new Date().toISOString().split("T")[0];
  const accessibility = extractStringField(fields, "accessibility") || "FULL";
  const commandLine = extractBooleanField(fields, "commandLine", false);
  const initLogin = extractBooleanField(fields, "initLogin", false);
  const userStatus = extractNumberField(fields, "userStatus", 1);

  // Extract roles (only if present on CBS wire response)
  let userRole: string[] = [];
  if (Array.isArray(fields.userRole)) {
    userRole = fields.userRole.map(String).filter(Boolean);
  } else if (typeof fields.userRole === "string" && fields.userRole.trim()) {
    userRole = [fields.userRole.trim()];
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
