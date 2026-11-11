import { type CurrentUser, currentUserSchema } from "@/lib/data-schemas/auth-schema";
import { decodeProtobufValue } from "./protobuf-decoder";

export interface ParsedUserAuthResult {
  currUser: CurrentUser;
  token: string;
}

/**
 * Strict parser to map CBS authentication wire payload into a CurrentUser domain session.
 * Purely extracts exact database wire fields without alternative fallbacks.
 * Accessibility is 1:1 with mock and core contracts.
 */
export function parseAuthWirePayload(data: unknown): ParsedUserAuthResult {
  const f = decodeProtobufValue<Record<string, unknown>>(data);

  const rawUser = {
    userId: typeof f.userId === "string" ? f.userId.trim() : "",
    fullName: typeof f.fullName === "string" ? f.fullName.trim() : "",
    branchCode: typeof f.branchCode === "string" ? f.branchCode.trim() : "",
    branchName: typeof f.branchName === "string" ? f.branchName.trim() : "",
    txnDate: typeof f.txnDate === "string" ? f.txnDate.trim() : "",
    userRole: Array.isArray(f.userRole) ? f.userRole.map(String) : [],
    accessibility: f.accessibility,
    commandLine: f.commandLine === true,
    initLogin: f.initLogin === true,
    userStatus: typeof f.userStatus === "number" ? f.userStatus : 1,
  };

  const currUser = currentUserSchema.parse(rawUser);

  return {
    currUser,
    token: typeof f.token === "string" ? f.token : "",
  };
}

/**
 * Serializer & sanitizer for CurrentUser sessions (SerDe outbound symmetry).
 * Sanitizes and normalizes the user profile before storage or transmission.
 */
export function sanitizeUserSession(user: CurrentUser): CurrentUser {
  return currentUserSchema.parse({
    userId: user.userId.trim().toUpperCase(),
    branchCode: user.branchCode.trim().toUpperCase(),
    fullName: user.fullName.trim(),
    userRole: user.userRole.map((r) => r.trim().toUpperCase()).filter(Boolean),
    accessibility: user.accessibility,
    branchName: user.branchName.trim(),
    txnDate: user.txnDate.trim(),
    commandLine: Boolean(user.commandLine),
    initLogin: Boolean(user.initLogin),
    userStatus: user.userStatus,
  });
}
