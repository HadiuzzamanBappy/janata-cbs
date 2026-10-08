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

  // Extract roles (supports protobuf string_value, list_value, plain strings, or arrays)
  let userRole: string[] = [];
  const rawRole = fields.userRole;
  if (Array.isArray(rawRole)) {
    userRole = rawRole.map(String).filter(Boolean);
  } else if (typeof rawRole === "string" && rawRole.trim() && rawRole !== "NULL_VALUE") {
    userRole = [rawRole.trim()];
  } else if (typeof rawRole === "object" && rawRole !== null) {
    if ("string_value" in rawRole && typeof (rawRole as { string_value: string }).string_value === "string") {
      const sv = (rawRole as { string_value: string }).string_value.trim();
      if (sv && sv !== "NULL_VALUE") userRole = [sv];
    } else if ("list_value" in rawRole) {
      const list = (rawRole as { list_value?: { values?: Array<{ string_value?: string }> } }).list_value?.values;
      if (Array.isArray(list)) {
        userRole = list.map((v) => v.string_value || "").filter(Boolean);
      }
    }
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
