import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { parseAuthWirePayload } from "@/lib/data-parsers";
import type { LoginInput } from "@/lib/data-schemas";
import { grpcStatusToHttp, loginProcess } from "@/lib/infra-grpc";
import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";
import { type CurrentUser, createSession, destroySession } from "@/lib/infra-redis";
import { getMockUserResponse } from "./mock-service";

export interface LoginResult {
  success: boolean;
  user?: CurrentUser;
  error?: string;
  statusCode?: number;
  errors?: string[];
}

/**
 * Universal authentication service for CBS core login and session creation.
 */
export async function loginUser({ username, password }: LoginInput): Promise<LoginResult> {
  let res: GrpcResponse;

  if (appConfig.auth.userSource === "static") {
    const mock = getMockUserResponse(username);
    if (!mock) return { success: false, error: "Invalid credentials", statusCode: 401 };
    res = mock;
  } else {
    try {
      res = await loginProcess({ clientId: appConfig.grpc.clientId, username, password });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("missing required authentication token")) {
        return { success: false, error: err.message, statusCode: 502 };
      }
      const { status, message } = grpcStatusToHttp(err);
      return { success: false, error: message, statusCode: status || 500 };
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

  const { currUser, token } = parseAuthWirePayload(res.data, username);
  await createSession({ userId: currUser.userId, token, currUser });

  return { success: true, user: currUser, statusCode: 200 };
}

/**
 * Terminate active user session from Redis and cookies.
 */
export async function logoutUser(): Promise<void> {
  await destroySession();
}
