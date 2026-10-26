import "server-only";

import { SC_USER, type UserRecord } from "@mock/db";
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

export function getMockUserResponse(username?: string, password?: string): GrpcResponse | null {
  if (!username || !password) return null;
  const cleanUser = username.trim().toUpperCase();

  // Find user strictly by signon ID or userId
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
 * Simulates Core gRPC login process from local user fixtures.
 * Strictly verifies that both username and password are provided and match.
 */
export async function mockLogin(
  req: LoginRequest | { signon?: string; username?: string; password?: string },
): Promise<GrpcResponse> {
  const username = ("username" in req && req.username) || ("signon" in req && req.signon) || "";
  const password = "password" in req && typeof req.password === "string" ? req.password : "";

  const authResponse = getMockUserResponse(username, password);
  if (!authResponse) {
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
  return authResponse;
}
