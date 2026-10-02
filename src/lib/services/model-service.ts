import "server-only";
import { STATIC_MODELS } from "@fixtures";
import { appConfig } from "@/lib/config";
import { getServiceUrl } from "@/lib/core/service-endpoints";
import { grpcProcess } from "@/lib/grpc";
import { parseGMC } from "@/lib/parsers";
import { getOrSet, getSession } from "@/lib/redis";
import type { FormSchema } from "@/lib/schemas";

const SPEC_TTL_SECONDS = appConfig.redis.specTtlSeconds;
const MODEL_REQUEST_TYPE = "GMC";
const MODEL_CONTROL_NAME = "?";
const MODEL_RECORD_FUNCTION = "S";

async function fetchModelWirePayload(command: string, tokenParam?: string): Promise<unknown> {
  const cleanCmd = command.split(",")[0].trim().toUpperCase();

  if (appConfig.modelSource === "static") {
    return STATIC_MODELS[cleanCmd]?.data ?? null;
  }

  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error(
      `UNAUTHENTICATED: No valid session token available for gRPC schema fetch (${cleanCmd})`,
    );
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
      requestType: MODEL_REQUEST_TYPE,
      controlName: MODEL_CONTROL_NAME,
      recordFunction: MODEL_RECORD_FUNCTION,
      recordId: cleanCmd,
      branchCode,
      authLevel: 1,
      userId,
      data: {},
    },
    { token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(
      `gRPC GMC fetch failed for ${cleanCmd} with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  return res.data;
}

export async function getModelData(command: string, token?: string): Promise<FormSchema | null> {
  const cleanCommand = command.toUpperCase();
  const cacheKey = `spec:${cleanCommand}`;
  return getOrSet(
    cacheKey,
    async () => {
      const wireData = await fetchModelWirePayload(cleanCommand, token);
      if (!wireData) return null;
      const parseResult = parseGMC(wireData, cleanCommand);
      return parseResult.success ? parseResult.data : null;
    },
    SPEC_TTL_SECONDS,
  );
}
