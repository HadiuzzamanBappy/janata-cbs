import "server-only";
import { STATIC_USER_RESPONSES } from "@fixtures";
import { appConfig } from "@/lib/config/server";
import { grpcStatusToHttp, loginProcess } from "@/lib/grpc";
import type { GrpcResponse } from "@/lib/grpc/generated/service";
import { parseAuthWirePayload } from "@/lib/parsers";
import { type CurrentUser, createSession, destroySession } from "@/lib/redis";
import type { LoginInput } from "@/lib/schemas";

export interface LoginResult {
  success: boolean;
  user?: CurrentUser;
  error?: string;
  statusCode?: number;
  errors?: string[];
}

/**
 * Universal authentication service for CBS core login and session creation.
 * Handles static mock personas and live gRPC core authentication identically.
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const { username, password } = input;
  const clientId = appConfig.grpc.clientId;

  let res: GrpcResponse;

  if (appConfig.auth.userSource === "static") {
    const normalizedInput = username.trim().toLowerCase();
    const matchedKey = Object.keys(STATIC_USER_RESPONSES).find(
      (k) => k.toLowerCase() === normalizedInput,
    );
    const mockResponse = matchedKey ? STATIC_USER_RESPONSES[matchedKey] : undefined;

    if (!mockResponse) {
      return {
        success: false,
        error: "Invalid credentials",
        statusCode: 401,
      };
    }
    res = mockResponse;
  } else {
    try {
      res = await loginProcess({ clientId, username, password });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("missing required authentication token")) {
        return {
          success: false,
          error: err.message,
          statusCode: 502,
        };
      }
      const { status, message } = grpcStatusToHttp(err);
      return {
        success: false,
        error: message,
        statusCode: status || 500,
      };
    }
  }

  if (res.statusCode !== 200 || res.status !== "SUCCESS") {
    return {
      success: false,
      error: res.message || "Invalid credentials",
      errors: res.errors,
      statusCode: res.statusCode || 401,
    };
  }

  // Single unified wire extraction
  const { currUser, token } = parseAuthWirePayload(res.data, username);

  await createSession({
    userId: currUser.userId,
    token,
    currUser,
  });

  return {
    success: true,
    user: currUser,
    statusCode: 200,
  };
}

/**
 * Terminate active user session from Redis and cookies.
 */
export async function logoutUser(): Promise<void> {
  await destroySession();
}
