import "server-only";

import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { parseAuthWirePayload } from "@/lib/data-parsers";
import { currentUserSchema, type LoginInput } from "@/lib/data-schemas";
import { type CurrentUser, createSession, destroySession } from "@/lib/infra-redis";
import { grpcStatusToHttp, loginProcess } from "./client";
import type { GrpcResponse } from "./generated/service";

const log = logger.withContext("AUTH_SERVICE");

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
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  let res: GrpcResponse;
  try {
    log.info(`Attempting login for user "${input.username}"`);
    res = await loginProcess({
      clientId: serverConfig.grpc.clientId,
      username: input.username,
      password: input.password,
    });
  } catch (err: unknown) {
    log.error(`Login process error for user "${input.username}"`, err);
    const { status, message } = grpcStatusToHttp(err);
    return {
      success: false,
      error: message,
      errors: [message],
      statusCode: status,
    };
  }

  if (res.status !== "SUCCESS" || (res.statusCode !== 200 && res.statusCode !== 0)) {
    const failureStatus = res.statusCode && res.statusCode !== 200 ? res.statusCode : 401;
    log.warn(
      `Login failed for user "${input.username}" (${failureStatus}): ${res.message || "Invalid credentials"}`,
    );
    return {
      success: false,
      error: res.message || "Invalid credentials",
      errors: res.errors,
      statusCode: failureStatus,
    };
  }

  const { currUser, token } = parseAuthWirePayload(res.data);

  // Strict Invariant: Validate bearer token & parsed user against schema (requires non-empty userId & branchCode)
  const validation = currentUserSchema.safeParse(currUser);
  if (!token || !validation.success) {
    const errorDetails = [
      ...(!token ? ["Core authentication response missing bearer token"] : []),
      ...(validation.success ? [] : validation.error.issues.map((issue) => issue.message)),
    ];
    log.error(`Login payload validation failed for "${input.username}"`, {
      errors: errorDetails,
      currUser,
    });
    return {
      success: false,
      error: errorDetails[0],
      errors: errorDetails,
      statusCode: 502,
    };
  }

  const validUser = validation.data;
  await createSession({ userId: validUser.userId, token, currUser: validUser });
  log.info(`User "${validUser.userId}" authenticated successfully. Session created.`);

  return { success: true, user: validUser, statusCode: 200 };
}

/**
 * Terminate active user session from Redis and cookies.
 */
export async function logoutUser(): Promise<void> {
  log.info("Terminating user session");
  await destroySession();
}
