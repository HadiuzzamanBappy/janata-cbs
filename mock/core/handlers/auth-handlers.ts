import "server-only";

import { SC_BRANCH, SC_USER, type UserRecord } from "@mock/db";
import type { GrpcResponse, LoginRequest } from "@/lib/infra-grpc/generated/service";

/**
 * Builds the dynamic runtime authentication response expected by auth-parser and session layer.
 * Strictly reads from SC_USER (UserRecord) where accessibility is an array of capability codes.
 */
export function buildMockUserAuthResponse(user: UserRecord): GrpcResponse {
  const branch = SC_BRANCH[user.branchCode];
  const branchName = branch?.branchTitle?.trim() || user.branchName || "CENTRAL OFFICE, HO, DHAKA";
  const txnDate = branch?.currTxnDate || new Date().toISOString().split("T")[0];

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
      initLogin: Boolean(user.initLogin),
      branchName,
      branchCode: user.branchCode,
      txnDate,
      userStatus: user.userStatus,
      authenticated: true,
      token: `mock_jwt_token_${user.userId}_${Date.now()}`,
    },
  };
}

export function getMockUserResponse(username?: string, password?: string): GrpcResponse | null {
  if (!username || !password) return null;
  const cleanUser = username.trim().toUpperCase();

  // Find user strictly by key or userId in SC_USER
  const user =
    SC_USER[cleanUser] || Object.values(SC_USER).find((u) => u.userId.toUpperCase() === cleanUser);
  if (!user) return null;

  // Strict password verification
  if (!user.password || user.password !== password) {
    return null;
  }

  return buildMockUserAuthResponse(user);
}

/**
 * Handles Core gRPC login requests from local SC_USER fixtures.
 * Strictly verifies that both username and password are provided and match.
 */
export async function handleLogin(
  req: LoginRequest | { signon?: string; username?: string; password?: string },
): Promise<GrpcResponse> {
  const username = ("username" in req && req.username) || ("signon" in req && req.signon) || "";
  const password = "password" in req && typeof req.password === "string" ? req.password : "";

  const authResponse = getMockUserResponse(username, password);
  if (!authResponse) {
    return {
      status: "FAIL",
      statusCode: 401,
      idempotencyKey: "",
      message: "Invalid credentials",
      errors: ["Invalid credentials"],
      timestamp: new Date().toISOString(),
      data: undefined,
    };
  }

  return authResponse;
}

/** Legacy alias for backwards compatibility across tests */
export const mockLogin = handleLogin;
