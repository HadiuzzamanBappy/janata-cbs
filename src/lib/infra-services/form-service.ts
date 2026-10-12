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
  resolveServiceContext,
} from "./service-context";

async function fetchModelWirePayload(cleanCmd: string, tokenParam?: string): Promise<unknown> {
  if (appConfig.modelSource === "static") {
    console.log(`[FormService] Model Source: static (fixture) for command: "${cleanCmd}"`);
    const mockData = getMockFormPayload(cleanCmd);
    console.log(`[FormService] Mock response received:`, JSON.stringify(mockData, null, 2));
    return mockData;
  }

  const ctx = await resolveServiceContext(tokenParam);
  const payload = {
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
  };

  console.log(
    `[FormService] >>> Outgoing gRPC Payload for "${cleanCmd}":`,
    JSON.stringify(payload, null, 2),
  );

  const res = await grpcProcess(ctx.address, GRPC_SERVICE_CATEGORY, payload, { token: ctx.token });

  console.log(
    `[FormService] <<< Incoming gRPC Response for "${cleanCmd}":`,
    JSON.stringify(res, null, 2),
  );

  if (res.statusCode !== 200 || !res.data) {
    // If a specific version (e.g. "USER.MGT,NEW1") wasn't found in the database,
    // fallback to the base model table ("USER.MGT") so the form can still render
    if (cleanCmd.includes(",")) {
      const baseCmd = cleanCmd.split(",")[0].trim();
      console.warn(
        `[FormService] ⚠️ Specific version "${cleanCmd}" not found (404). Falling back to base model "${baseCmd}"...`,
      );
      return fetchModelWirePayload(baseCmd, tokenParam);
    }

    throw new Error(
      `gRPC GMC fetch failed for ${cleanCmd} (${res.statusCode}): ${res.message || "No data"}`,
    );
  }

  return res.data;
}

/**
 * Normalizes form command strings while preserving versions (e.g., "USER.MGT,NEW1" -> "USER.MGT,NEW1").
 * Only strips action function codes and whitespace.
 */
function normalizeFormCommand(command: string): string {
  return command
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();
}

/**
 * Retrieves the screen schema specification for a dynamic CBS transaction form (cached in Redis).
 */
export async function getFormData(command: string, token?: string): Promise<FormSchema | null> {
  const cleanCmd = normalizeFormCommand(command);

  return getOrSet(
    appConfig.redis.cacheKeys.formSpec(cleanCmd),
    async () => {
      const wireData = await fetchModelWirePayload(cleanCmd, token);
      if (!wireData) return null;
      const parseResult = parseGMC(wireData, cleanCmd);
      if (!parseResult.success) {
        console.error(`[FormService] ❌ parseGMC failed for "${cleanCmd}":`, parseResult.error);
        return null;
      }
      console.log(`[FormService] ✅ parseGMC succeeded for "${cleanCmd}"`);
      return parseResult.data;
    },
    appConfig.redis.specTtlSeconds,
  );
}
