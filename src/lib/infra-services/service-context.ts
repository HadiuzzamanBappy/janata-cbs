import "server-only";

import { cookies } from "next/headers";
import { appConfig, getServiceUrl } from "@/lib/core-config/server";
import { getSession } from "@/lib/infra-redis";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const GRPC_SERVICE_CATEGORY = "nonfinancial";
export const DEFAULT_AUTH_LEVEL = 1;

/* -------------------------------------------------------------------------- */
/* Service Context & Wire Transport Helpers                                   */
/* -------------------------------------------------------------------------- */

export interface ServiceContext {
  token: string;
  userId: string;
  branchCode: string;
  address: string;
  clientId: string;
}

/**
 * Resolves active user session, banking credentials, and target gRPC service URL.
 * Fails fast with UNAUTHENTICATED error if no session token or user ID is available.
 */
export async function resolveServiceContext(tokenParam?: string): Promise<ServiceContext> {
  const session = await getSession();
  const token = tokenParam || session?.token;

  if (!token) {
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC request");
  }

  const userId = session?.currUser?.userId || session?.userId;
  if (!userId) {
    throw new Error("UNAUTHENTICATED: No authenticated user ID found in session");
  }

  const store = await cookies().catch(() => null);
  const cookieBranch = store?.get(appConfig.auth.branchCookie)?.value;
  const branchCode = cookieBranch || session?.currUser?.branchCode || appConfig.centralBranch;
  const address = getServiceUrl();
  const clientId = appConfig.grpc.clientId;

  return {
    token,
    userId,
    branchCode,
    address,
    clientId,
  };
}

/**
 * Normalizes user-entered command strings (e.g., "INQ AC.LIST,1" -> "AC.LIST").
 * Strips command prefixes, function codes, and parameter suffixes.
 */
export function normalizeCommand(command: string): string {
  return command
    .split(",")[0]
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();
}
