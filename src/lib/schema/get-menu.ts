import "server-only";
import { STATIC_MENU } from "@fixtures";
import { type MenuItem, parseMNU } from "@/features/workspace";
import { env } from "@/lib/config/env";
import { getOrSet } from "@/lib/core/cache";
import { getSession } from "@/lib/core/redis-session";
import { getServiceUrl } from "@/lib/core/services";
import { grpcProcess } from "@/lib/grpc";

const MENU_TTL_SECONDS = env.MENU_TTL_SECONDS || 600;

async function fetchMenuFromBackend(tokenParam?: string): Promise<MenuItem[]> {
  // Static environment mode
  if (env.MODEL_SOURCE === "static") {
    const parseResult = parseMNU(STATIC_MENU);
    if (!parseResult.success) {
      throw new Error(`Failed to parse static menu: ${parseResult.error}`);
    }
    return parseResult.data;
  }

  // gRPC environment mode (Strict execution, no fallbacks)
  const session = await getSession();
  const token = tokenParam || session?.token;
  const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
  const branchCode = session?.currUser?.branchCode || env.NEXT_PUBLIC_CENTRAL_BRANCH || "JB9999";

  const targetServiceKey = process.env.NODE_ENV === "development" ? "defaultdev" : "default";
  const address = getServiceUrl(targetServiceKey);

  const res = await grpcProcess(
    address,
    "nonfinancial",
    {
      idempotencyKey: "",
      clientId: "WEB-CLIENT",
      requestType: env.MENU_REQUEST_TYPE || "MNU",
      controlName: env.MENU_CONTROL_NAME || "MAIN_MENU",
      recordFunction: "L",
      recordId: "",
      branchCode,
      authLevel: 1,
      userId,
      data: {},
    },
    { token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(`gRPC menu fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`);
  }

  const parsed = parseMNU(res.data);
  if (!parsed.success) {
    throw new Error(`gRPC menu schema parsing failed: ${parsed.error}`);
  }

  return parsed.data;
}

/**
 * Server Component / RSC menu fetcher with read-through Redis cache.
 */
export async function getMenuData(token?: string): Promise<MenuItem[]> {
  const cacheKey = `menu:${env.MENU_CONTROL_NAME || "MAIN_MENU"}`;
  return getOrSet(cacheKey, () => fetchMenuFromBackend(token), MENU_TTL_SECONDS);
}
