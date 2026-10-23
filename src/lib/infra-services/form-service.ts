import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { parseGMC } from "@/lib/data-parsers";
import type { ParsedFormData } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CbsRecordFunction, CbsRequestType } from "@/types";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  normalizeCommand,
  resolveServiceContext,
} from "./service-context";

async function fetchModelWirePayload(cleanCmd: string, tokenParam?: string): Promise<unknown> {
  const ctx = await resolveServiceContext(tokenParam);
  const payload = {
    idempotencyKey: "",
    clientId: ctx.clientId,
    requestType: CbsRequestType.GMC,
    controlName: "?",
    recordFunction: CbsRecordFunction.SEE,
    recordId: cleanCmd,
    branchCode: ctx.branchCode,
    authLevel: DEFAULT_AUTH_LEVEL,
    userId: ctx.userId,
    data: {},
  };

  const res = await grpcProcess(ctx.address, GRPC_SERVICE_CATEGORY, payload, {
    token: ctx.token,
  });

  if (res.statusCode !== 200 || !res.data) {
    // If a specific version (e.g. "USER.MGT,NEW1") wasn't found in the database,
    // fallback to the base model table ("USER.MGT") so the form can still render
    if (cleanCmd.includes(",")) {
      const baseCmd = cleanCmd.split(",")[0].trim();
      logger.warn(
        `Specific version "${cleanCmd}" not found (404). Falling back to base model "${baseCmd}"...`,
        undefined,
        "FORM_SERVICE",
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
 * Retrieves the screen schema specification for a dynamic CBS transaction form (cached in Redis).
 */
export async function getFormData(command: string, token?: string): Promise<ParsedFormData | null> {
  const cleanCmd = normalizeCommand(command, { preserveVersion: true });

  return getOrSet(
    appConfig.redis.cacheKeys.formSpec(cleanCmd),
    async () => {
      const wireData = await fetchModelWirePayload(cleanCmd, token);
      if (!wireData) return null;
      const parseResult = parseGMC(wireData, cleanCmd);
      if (!parseResult.success) {
        logger.error(`parseGMC failed for "${cleanCmd}"`, parseResult.error, "FORM_SERVICE");
        return null;
      }
      return parseResult.data;
    },
    appConfig.redis.specTtlSeconds,
  );
}
