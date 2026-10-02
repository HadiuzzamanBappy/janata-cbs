import "server-only";
import { STATIC_MENU } from "@fixtures";
import { appConfig } from "@/lib/config";
import { getServiceUrl } from "@/lib/core/service-endpoints";
import { grpcProcess } from "@/lib/grpc";
import { parseMNU } from "@/lib/parsers";
import { getOrSet, getSession } from "@/lib/redis";
import type { MenuItem } from "@/lib/schemas";

const MENU_TTL_SECONDS = appConfig.redis.menuTtlSeconds;
const DEFAULT_MENU_CONTROL = "MAIN_MENU";
const MENU_REQUEST_TYPE = "GUM";
const MENU_RECORD_FUNCTION = "L";

async function fetchMenuWirePayload(controlName: string, tokenParam?: string): Promise<unknown> {
  if (appConfig.modelSource === "static") {
    return STATIC_MENU.data;
  }

  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC menu fetch");
  }

  const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
  const branchCode = session?.currUser?.branchCode || appConfig.centralBranch;
  const address = getServiceUrl("default");

  const res = await grpcProcess(
    address,
    "nonfinancial",
    {
      idempotencyKey: "",
      clientId: appConfig.grpc.clientId,
      requestType: MENU_REQUEST_TYPE,
      controlName,
      recordFunction: MENU_RECORD_FUNCTION,
      recordId: "",
      branchCode,
      authLevel: 1,
      userId,
      data: {},
    },
    { token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(
      `gRPC menu fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  return res.data;
}

export async function getMenuData(
  token?: string,
  controlName: string = DEFAULT_MENU_CONTROL,
): Promise<MenuItem[]> {
  const cacheKey = `menu:${controlName}`;
  return getOrSet(
    cacheKey,
    async () => {
      const wireData = await fetchMenuWirePayload(controlName, token);
      const parseResult = parseMNU(wireData);
      if (!parseResult.success) {
        throw new Error(`Failed to parse menu: ${parseResult.error}`);
      }
      return parseResult.data;
    },
    MENU_TTL_SECONDS,
  );
}
