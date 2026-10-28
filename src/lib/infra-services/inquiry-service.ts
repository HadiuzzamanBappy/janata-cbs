import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { parseInquiryConfig } from "@/lib/data-parsers";
import type { InquiryConfigRecord } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  normalizeCommand,
  resolveServiceContext,
} from "./service-context";

const log = logger.withContext("INQUIRY_SERVICE");

async function fetchInquiryWirePayload(cleanCmd: string, tokenParam?: string): Promise<unknown> {
  const ctx = await resolveServiceContext(tokenParam);
  const payload = {
    idempotencyKey: "",
    clientId: ctx.clientId,
    requestType: CbsRequestType.GET,
    controlName: CbsControlTable.INQUIRY_CONFIG,
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
    log.error(
      `Inquiry wire fetch failed for "${cleanCmd}" (${res.statusCode}): ${res.message || "No data"}`,
    );
    return null;
  }

  return res.data;
}

/**
 * Retrieves and caches the canonical CBS Inquiry configuration schema.
 */
export async function getInquiryData(
  command: string,
  token?: string,
): Promise<InquiryConfigRecord | null> {
  const cleanCmd = normalizeCommand(command);

  return getOrSet(
    appConfig.redis.cacheKeys.inquirySpec(cleanCmd),
    async () => {
      const wireData = await fetchInquiryWirePayload(cleanCmd, token);
      if (!wireData) return null;

      const parseResult = parseInquiryConfig(wireData);
      if (!parseResult.success) {
        log.error(`parseInquiryConfig validation failed for "${cleanCmd}"`, parseResult.error);
        return null;
      }

      return parseResult.data;
    },
    appConfig.redis.specTtlSeconds,
  );
}
