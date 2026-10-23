import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { parseControlsWirePayload } from "@/lib/data-parsers";
import type { SystemCommandItem } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  resolveServiceContext,
} from "./service-context";

async function fetchControlWirePayload(tokenParam?: string): Promise<unknown> {
  const ctx = await resolveServiceContext(tokenParam);
  const res = await grpcProcess(
    ctx.address,
    GRPC_SERVICE_CATEGORY,
    {
      idempotencyKey: "",
      clientId: ctx.clientId,
      requestType: CbsRequestType.GRL,
      controlName: CbsControlTable.CONTROL,
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
    throw new Error(`gRPC controls fetch failed (${res.statusCode}): ${res.message || "No data"}`);
  }

  return res.data;
}

/**
 * Retrieves the catalog of active CBS system control commands (cached in Redis).
 */
export async function getControlsData(token?: string): Promise<SystemCommandItem[]> {
  return getOrSet(
    appConfig.redis.cacheKeys.controls,
    async () => parseControlsWirePayload(await fetchControlWirePayload(token)),
    appConfig.redis.menuTtlSeconds,
  );
}
