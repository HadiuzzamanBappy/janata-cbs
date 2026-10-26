import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { parseAuthWirePayload } from "@/lib/data-parsers";
import type { LoginInput } from "@/lib/data-schemas";
import { grpcStatusToHttp, loginProcess } from "@/lib/infra-grpc";
import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";
import { type CurrentUser, createSession, destroySession } from "@/lib/infra-redis";

const log = logger.withContext("AUTH_SERVICE");

export interface LoginResult {
  success: boolean;
  user?: CurrentUser;
  error?: string;
  statusCode?: number;
  errors?: string[];
}

async function fetchAuthWirePayload({ username, password }: LoginInput): Promise<GrpcResponse> {
  try {
    log.info(`Attempting login for user "${username}"`);
    return await loginProcess({ clientId: appConfig.grpc.clientId, username, password });
  } catch (err: unknown) {
    log.error(`Login process error for user "${username}"`, err);
    if (err instanceof Error && err.message.includes("missing required authentication token")) {
      return {
        status: "FAILED",
        statusCode: 502,
        idempotencyKey: "",
        message: err.message,
        errors: [err.message],
        timestamp: new Date().toISOString(),
        data: undefined,
      };
    }
    const { status, message } = grpcStatusToHttp(err);
    return {
      status: "FAILED",
      statusCode: status || 500,
      idempotencyKey: "",
      message,
      errors: [message],
      timestamp: new Date().toISOString(),
      data: undefined,
    };
  }
}

/**
 * Universal authentication service for CBS core login and session creation.
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const res = await fetchAuthWirePayload(input);

  if (res.statusCode !== 200 || res.status !== "SUCCESS") {
    log.warn(
      `Login failed for user "${input.username}" (${res.statusCode}): ${res.message || "Invalid credentials"}`,
    );
    return {
      success: false,
      error: res.message || "Invalid credentials",
      errors: res.errors,
      statusCode: res.statusCode || 401,
    };
  }

  const { currUser, token } = parseAuthWirePayload(res.data, input.username);
  await createSession({ userId: currUser.userId, token, currUser });
  log.info(`User "${currUser.userId}" authenticated successfully. Session created.`);

  return { success: true, user: currUser, statusCode: 200 };
}

/**
 * Terminate active user session from Redis and cookies.
 */
export async function logoutUser(): Promise<void> {
  log.info("Terminating user session");
  await destroySession();
}
