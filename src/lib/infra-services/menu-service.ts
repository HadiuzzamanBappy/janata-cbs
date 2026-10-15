import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { parseMNU } from "@/lib/data-parsers";
import type { MenuItem } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CbsRecordFunction, CbsRequestType } from "@/types/cbs";
import { getStaticData, isStaticMode } from "./cbs-gateway";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  resolveServiceContext,
} from "./service-context";

async function fetchMenuWirePayload(controlName: string, tokenParam?: string): Promise<unknown> {
  if (isStaticMode()) return getStaticData("MENU");

  const ctx = await resolveServiceContext(tokenParam);
  const res = await grpcProcess(
    ctx.address,
    GRPC_SERVICE_CATEGORY,
    {
      idempotencyKey: "",
      clientId: ctx.clientId,
      requestType: CbsRequestType.GUM,
      controlName,
      recordFunction: CbsRecordFunction.LIST,
      recordId: "",
      branchCode: ctx.branchCode,
      authLevel: DEFAULT_AUTH_LEVEL,
      userId: ctx.userId,
      data: {},
    },
    { token: ctx.token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(`gRPC menu fetch failed (${res.statusCode}): ${res.message || "No data"}`);
  }

  return res.data;
}

/**
 * Retrieves the CBS application navigation menu tree for the current user (cached in Redis).
 */
export async function getMenuData(token?: string, controlName: string = ""): Promise<MenuItem[]> {
  return getOrSet(
    appConfig.redis.cacheKeys.menu(controlName),
    async () => {
      const wireData = await fetchMenuWirePayload(controlName, token);
      const parseResult = parseMNU(wireData);
      if (!parseResult.success) throw new Error(`Failed to parse menu: ${parseResult.error}`);
      return parseResult.data;
    },
    appConfig.redis.menuTtlSeconds,
  );
}
