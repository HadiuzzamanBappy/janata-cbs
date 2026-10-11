import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { parseBranchesWirePayload } from "@/lib/data-parsers";
import type { BranchRecord } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CBS_RECORD_FUNCTIONS, CbsControlTable, CbsRequestType } from "@/types/cbs";
import { getMockBranchesPayload } from "./mock-service";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  resolveServiceContext,
} from "./service-context";

async function fetchBranchWirePayload(tokenParam?: string): Promise<unknown> {
  if (appConfig.modelSource === "static") return getMockBranchesPayload();

  const ctx = await resolveServiceContext(tokenParam);
  const res = await grpcProcess(
    ctx.address,
    GRPC_SERVICE_CATEGORY,
    {
      idempotencyKey: "",
      clientId: ctx.clientId,
      requestType: CbsRequestType.GRL,
      controlName: CbsControlTable.BRANCH,
      recordFunction: CBS_RECORD_FUNCTIONS.LIST,
      recordId: "",
      branchCode: ctx.branchCode,
      authLevel: DEFAULT_AUTH_LEVEL,
      userId: ctx.userId,
      data: {},
    },
    { token: ctx.token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(`gRPC branch fetch failed (${res.statusCode}): ${res.message || "No data"}`);
  }

  return res.data;
}

/**
 * Retrieves the CBS branch directory (cached in Redis).
 */
export async function getBranchesData(token?: string): Promise<BranchRecord[]> {
  return getOrSet(
    appConfig.redis.cacheKeys.branches,
    async () => parseBranchesWirePayload(await fetchBranchWirePayload(token)),
    appConfig.redis.specTtlSeconds,
  );
}
