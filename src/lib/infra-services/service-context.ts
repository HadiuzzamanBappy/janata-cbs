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
  const session = await getSession().catch(() => null);
  const token = tokenParam || session?.token;

  if (!token) {
    if (appConfig.dataSource === "static") {
      return {
        token: "mock_static_token",
        userId: "ZZ0284590",
        branchCode: appConfig.centralBranch || "JB9999",
        address: getServiceUrl(),
        clientId: appConfig.grpc.clientId,
      };
    }
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC request");
  }

  const userId = session?.currUser?.userId || session?.userId;
  if (!userId) {
    if (appConfig.dataSource === "static") {
      return {
        token,
        userId: "ZZ0284590",
        branchCode: appConfig.centralBranch || "JB9999",
        address: getServiceUrl(),
        clientId: appConfig.grpc.clientId,
      };
    }
    throw new Error("UNAUTHENTICATED: No authenticated user ID found in session");
  }

  let cookieBranch: string | undefined;
  try {
    const store = await cookies();
    cookieBranch = store.get(appConfig.auth.branchCookie)?.value;
  } catch {
    cookieBranch = undefined;
  }
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
 * Set `preserveVersion: true` to keep comma version suffixes (e.g., "USER.MGT,NEW1").
 */
export function normalizeCommand(command: string, options?: { preserveVersion?: boolean }): string {
  const base = options?.preserveVersion ? command : command.split(",")[0];
  return base
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .replace(/(?:\s+[SRIDAH])$/i, "")
    .trim();
}
