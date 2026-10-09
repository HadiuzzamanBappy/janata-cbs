import "server-only";
import { appConfig, getServiceUrl } from "@/lib/config/server";
import { grpcProcess } from "@/lib/grpc";
import { parseControlsWirePayload } from "@/lib/parsers";
import { getOrSet, getSession } from "@/lib/redis";
import type { SystemCommandItem } from "@/lib/schemas";
import { getStaticControlsPayload } from "./static-provider";

const CONTROLS_TTL_SECONDS = appConfig.redis.menuTtlSeconds;
const CONTROL_REQUEST_TYPE = "GRL";
const CONTROL_CONTROL_NAME = "CONTROL";
const CONTROL_RECORD_FUNCTION = "L";

async function fetchControlWirePayload(tokenParam?: string): Promise<unknown> {
  if (appConfig.modelSource === "static") {
    return getStaticControlsPayload();
  }

  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC controls fetch");
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
      requestType: CONTROL_REQUEST_TYPE,
      controlName: CONTROL_CONTROL_NAME,
      recordFunction: CONTROL_RECORD_FUNCTION,
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
      `gRPC controls fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  return res.data;
}

export async function getControlsData(token?: string): Promise<SystemCommandItem[]> {
  const cacheKey = "controls:list";
  return getOrSet(
    cacheKey,
    async () => {
      const wireData = await fetchControlWirePayload(token);
      return parseControlsWirePayload(wireData);
    },
    CONTROLS_TTL_SECONDS,
  );
}
