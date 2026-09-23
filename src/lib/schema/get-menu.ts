import "server-only";
import { STATIC_MENU } from "@fixtures";
import { type MenuItem, parseMNU } from "@/features/workspace";
import { env } from "@/lib/config/env";
import { getOrSet } from "@/lib/core/cache";
import { grpcProcess } from "@/lib/core/grpc";
import { getServiceUrl } from "@/lib/core/services";

const MENU_TTL_SECONDS = env.MENU_TTL_SECONDS || 600;

async function fetchMenuFromBackend(token?: string): Promise<MenuItem[]> {
  if (env.MODEL_SOURCE === "static") {
    const parseResult = parseMNU(STATIC_MENU);
    return parseResult.success ? parseResult.data : [];
  }

  try {
    const targetServiceKey =
      process.env.NODE_ENV === "development" ? "defaultdev" : "default";
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
        branchCode: env.NEXT_PUBLIC_CENTRAL_BRANCH || "JB9999",
        authLevel: 1,
        userId: "SYSUSER",
        data: {},
      },
      { token },
    );

    if (res.statusCode !== 200 || !res.data) {
      const fallbackResult = parseMNU(STATIC_MENU);
      return fallbackResult.success ? fallbackResult.data : [];
    }

    const parsed = parseMNU(res.data);
    if (parsed.success) {
      return parsed.data;
    }

    const fallbackResult = parseMNU(STATIC_MENU);
    return fallbackResult.success ? fallbackResult.data : [];
  } catch (err) {
    console.warn(
      "[menu] gRPC menu fetch failed, falling back to static menu:",
      err,
    );
    const fallbackResult = parseMNU(STATIC_MENU);
    return fallbackResult.success ? fallbackResult.data : [];
  }
}

/**
 * Server Component / RSC menu fetcher with read-through Redis cache.
 */
export async function getMenuData(token?: string): Promise<MenuItem[]> {
  const cacheKey = `menu:${env.MENU_CONTROL_NAME || "MAIN_MENU"}`;
  return getOrSet(
    cacheKey,
    () => fetchMenuFromBackend(token),
    MENU_TTL_SECONDS,
  );
}
