import "server-only";

import { SYS_USER_LIVE, type UserRecord } from "@mock/db";
import type { GrpcResponse, LoginRequest } from "@/lib/infra-grpc/generated/service";

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
 * Canonical user authentication response catalog.
 */
export const SYS_USER_AUTH_RESPONSES: Record<string, GrpcResponse> = Object.fromEntries(
  Object.entries(SYS_USER_LIVE).map(([signon, user]) => [signon, buildMockUserAuthResponse(user)]),
);

export function getMockUserResponse(username?: string, password?: string): GrpcResponse | null {
  if (!username) return null;
  const clean = username.trim().toUpperCase();

  // Find user strictly by entry key (username) or fallback to matching userId
  const matchingEntry = Object.entries(SYS_USER_LIVE).find(
    ([key, u]) => key.toUpperCase() === clean || u.userId?.toUpperCase() === clean,
  );

  if (!matchingEntry) return null;

  const [_, user] = matchingEntry;

  // If password was provided, verify it matches
  if (password !== undefined && user.password && user.password !== password) {
    return null;
  }

  return buildMockUserAuthResponse(user);
}

/**
 * Simulates Core gRPC login process from local user fixtures.
 * Properly checks username (entry ID) and password.
 */
export async function mockLogin(
  req: LoginRequest | { signon?: string; username?: string; password?: string },
): Promise<GrpcResponse> {
  const username =
    "username" in req && req.username
      ? req.username
      : "signon" in req && req.signon
        ? req.signon
        : "";
  const password = "password" in req && req.password ? req.password : undefined;

  const mock = getMockUserResponse(username, password);
  if (!mock) {
    return {
      status: "FAILED",
      statusCode: 401,
      idempotencyKey: "",
      message: "Invalid credentials",
      errors: ["Invalid credentials"],
      timestamp: new Date().toISOString(),
      data: undefined,
    };
  }
  return mock;
}
