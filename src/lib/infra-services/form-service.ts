import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { parseFormConfig } from "@/lib/data-parsers";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CbsRecordFunction, CbsRequestType } from "@/types";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  normalizeCommand,
  resolveServiceContext,
} from "./service-context";

const log = logger.withContext("FORM_SERVICE");

async function fetchModelWirePayload(cleanCmd: string, tokenParam?: string): Promise<unknown> {
  const ctx = await resolveServiceContext(tokenParam);
  const payload = {
    idempotencyKey: "",
    clientId: ctx.clientId,
    requestType: CbsRequestType.GFC,
    controlName: "CONFIG.FORM",
    recordFunction: CbsRecordFunction.SEE,
    recordId: cleanCmd,
    branchCode: ctx.branchCode,
    authLevel: DEFAULT_AUTH_LEVEL,
    userId: ctx.userId,
    data: {},
  };

  log.info(`Outgoing gRPC Payload for GFC "${cleanCmd}"`, payload);

  const res = await grpcProcess(ctx.address, GRPC_SERVICE_CATEGORY, payload, {
    token: ctx.token,
  });

  log.info(`Incoming gRPC Response for GFC "${cleanCmd}"`, res);

  if (res.statusCode !== 200 || !res.data) {
    if (cleanCmd.includes(",")) {
      const baseCmd = cleanCmd.split(",")[0].trim();
      log.warn(
        `Specific version "${cleanCmd}" not found (404). Falling back to base model "${baseCmd}"...`,
      );
      return fetchModelWirePayload(baseCmd, tokenParam);
    }

    throw new Error(
      `gRPC GFC fetch failed for ${cleanCmd} (${res.statusCode}): ${res.message || "No data"}`,
    );
  }

  return res.data;
}

/**
 * Retrieves the screen schema specification for a dynamic CBS transaction form (cached in Redis).
 */
export async function getFormData(
  command: string,
  token?: string,
): Promise<FormConfigRecord | null> {
  const cleanCmd = normalizeCommand(command, { preserveVersion: true });

  return getOrSet(
    appConfig.redis.cacheKeys.formSpec(cleanCmd),
    async () => {
      const wireData = await fetchModelWirePayload(cleanCmd, token);
      if (!wireData) return null;
      const parseResult = parseFormConfig(wireData);
      if (!parseResult.success) {
        log.error(`parseFormConfig failed for "${cleanCmd}"`, parseResult.error);
        return null;
      }
      return parseResult.data;
    },
    appConfig.redis.specTtlSeconds,
  );
}
