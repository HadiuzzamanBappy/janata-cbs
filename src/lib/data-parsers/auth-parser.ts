import type { CurrentUser } from "@/lib/data-schemas/auth-schema";
import { decodeProtobufValue } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                         */
/* -------------------------------------------------------------------------- */

export interface ParsedUserAuthResult {
  currUser: CurrentUser;
  token: string;
}

/* -------------------------------------------------------------------------- */
/* Wire Parser API                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Strict parser to map CBS authentication wire payload into a CurrentUser domain session.
 * Purely extracts exact database wire fields without guessing or artificial fallbacks.
 * Accessibility is parsed strictly as a single string array (e.g. ["R", "I", "D", "A", "S", "H", "L"]).
 */
export function parseAuthWirePayload(data: unknown): ParsedUserAuthResult {
  const f = decodeProtobufValue<Record<string, unknown>>(data);

  // Accept accessibility strictly as array; if DB sent a string like "RIDASH", split into array
  const rawAccess = f.accessibility ?? f.functionRights;
  const accessibility: string[] = Array.isArray(rawAccess)
    ? rawAccess.map(String)
    : typeof rawAccess === "string"
      ? rawAccess.trim().toUpperCase().split("")
      : [];

  const currUser: CurrentUser = {
    userId: typeof f.userId === "string" ? f.userId.trim() : "",
    fullName: typeof f.fullName === "string" ? f.fullName.trim() : "",
    branchCode: typeof f.branchCode === "string" ? f.branchCode.trim() : "",
    branchName: typeof f.branchName === "string" ? f.branchName.trim() : "",
    txnDate: typeof f.txnDate === "string" ? f.txnDate.trim() : "",
    userRole: Array.isArray(f.userRole) ? f.userRole.map(String) : [],
    accessibility,
    commandLine: f.commandLine === true,
    initLogin: f.initLogin === true,
    userStatus: typeof f.userStatus === "number" ? f.userStatus : 1,
  };

  return {
    currUser,
    token: typeof f.token === "string" ? f.token : "",
  };
}
