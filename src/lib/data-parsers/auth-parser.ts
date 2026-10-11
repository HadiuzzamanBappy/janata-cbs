import type { CurrentUser } from "@/lib/data-schemas/auth-schema";
import { CBS_FUNCTION_CODES } from "@/types/cbs";
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
 * Standard parser to map CBS authentication response payload into a CurrentUser domain session.
 * Purely extracts database wire fields without artificial mock defaults.
 */
export function parseAuthWirePayload(data: unknown, fallbackUsername = ""): ParsedUserAuthResult {
  const f = decodeProtobufValue<Record<string, unknown>>(data);

  const rawAccessibility = typeof f.accessibility === "string" ? f.accessibility.trim() : "";

  const functionRights = rawAccessibility
    ? rawAccessibility === "FULL" || rawAccessibility === "ALL"
      ? [...CBS_FUNCTION_CODES]
      : rawAccessibility
          .toUpperCase()
          .split("")
          .filter((char) => (CBS_FUNCTION_CODES as readonly string[]).includes(char))
    : [];

  const currUser: CurrentUser = {
    userId: String(f.userId || ""),
    fullName: String(f.fullName || fallbackUsername || f.userId || ""),
    branchCode: String(f.branchCode || ""),
    branchName: String(f.branchName || ""),
    txnDate: String(f.txnDate || ""),
    lastTxnDate: f.lastTxnDate ? String(f.lastTxnDate) : undefined,
    nextDate: f.nextDate ? String(f.nextDate) : undefined,
    userRole: Array.isArray(f.userRole)
      ? f.userRole.map(String)
      : f.userRole
        ? [String(f.userRole)]
        : [],
    accessibility: rawAccessibility,
    functionRights,
    commandLine: Boolean(f.commandLine),
    initLogin: Boolean(f.initLogin),
    isLoggedIn: true,
    userStatus: typeof f.userStatus === "number" ? f.userStatus : 0,
  };

  return {
    currUser,
    token: String(f.token || ""),
  };
}
