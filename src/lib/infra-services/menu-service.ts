import "server-only";
import { appConfig, getServiceUrl } from "@/lib/core-config/server";
import { parseMNU } from "@/lib/data-parsers";
import type { MenuItem } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet, getSession } from "@/lib/infra-redis";
import { getStaticMenuPayload } from "./static-provider";

const MENU_TTL_SECONDS = appConfig.redis.menuTtlSeconds;
const DEFAULT_MENU_CONTROL = "MAIN_MENU";
const MENU_REQUEST_TYPE = "GUM";
const MENU_RECORD_FUNCTION = "L";

async function fetchMenuWirePayload(controlName: string, tokenParam?: string): Promise<unknown> {
  if (appConfig.modelSource === "static") {
    return getStaticMenuPayload();
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
