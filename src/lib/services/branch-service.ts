import "server-only";

import { STATIC_BRANCH_RESPONSE } from "@fixtures";
import { appConfig } from "@/lib/config";
import { getServiceUrl } from "@/lib/config/service-endpoints";
import { grpcProcess } from "@/lib/grpc";
import { parseBranchesWirePayload } from "@/lib/parsers";
import { getOrSet, getSession } from "@/lib/redis";
import type { BranchRecord } from "@/lib/schemas";

const BRANCH_TTL_SECONDS = appConfig.redis.specTtlSeconds;
const BRANCH_REQUEST_TYPE = "GRL";
const BRANCH_CONTROL_NAME = "BRANCH";
const BRANCH_RECORD_FUNCTION = "L";

async function fetchBranchWirePayload(tokenParam?: string): Promise<unknown> {
  if (appConfig.modelSource === "static") {
    return STATIC_BRANCH_RESPONSE.data;
  }

  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC branch fetch");
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
      requestType: BRANCH_REQUEST_TYPE,
      controlName: BRANCH_CONTROL_NAME,
      recordFunction: BRANCH_RECORD_FUNCTION,
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
      `gRPC branch fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  return res.data;
}

export async function getBranchesData(token?: string): Promise<BranchRecord[]> {
  const cacheKey = "branches:directory";
  return getOrSet(
    cacheKey,
    async () => {
      const wireData = await fetchBranchWirePayload(token);
      return parseBranchesWirePayload(wireData);
    },
    BRANCH_TTL_SECONDS,
  );
}
