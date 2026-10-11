import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { parseGMC } from "@/lib/data-parsers";
import type { FormSchema } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CBS_RECORD_FUNCTIONS, CbsRequestType } from "@/types/cbs";
import { getMockFormPayload } from "./mock-service";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  normalizeCommand,
  resolveServiceContext,
} from "./service-context";

async function fetchModelWirePayload(cleanCmd: string, tokenParam?: string): Promise<unknown> {
  if (appConfig.modelSource === "static") return getMockFormPayload(cleanCmd);

  const ctx = await resolveServiceContext(tokenParam);
  const res = await grpcProcess(
    ctx.address,
    GRPC_SERVICE_CATEGORY,
    {
      idempotencyKey: "",
      clientId: ctx.clientId,
      requestType: CbsRequestType.GMC,
      controlName: "?",
      recordFunction: CBS_RECORD_FUNCTIONS.SEE,
      recordId: cleanCmd,
      branchCode: ctx.branchCode,
      authLevel: DEFAULT_AUTH_LEVEL,
      userId: ctx.userId,
      data: {},
    },
    { token: ctx.token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(
      `gRPC GMC fetch failed for ${cleanCmd} (${res.statusCode}): ${res.message || "No data"}`,
    );
  }

  return res.data;
}

/**
 * Retrieves the screen schema specification for a dynamic CBS transaction form (cached in Redis).
 */
export async function getFormData(command: string, token?: string): Promise<FormSchema | null> {
  const cleanCmd = normalizeCommand(command);

  return getOrSet(
    appConfig.redis.cacheKeys.formSpec(cleanCmd),
    async () => {
      const wireData = await fetchModelWirePayload(cleanCmd, token);
      if (!wireData) return null;
      const parseResult = parseGMC(wireData, cleanCmd);
      return parseResult.success ? parseResult.data : null;
    },
    appConfig.redis.specTtlSeconds,
  );
}
