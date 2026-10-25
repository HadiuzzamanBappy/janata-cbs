import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { parseEnquiry } from "@/lib/data-parsers";
import type { EnquiryRow, EnquirySchema } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  normalizeCommand,
  resolveServiceContext,
} from "./service-context";

async function fetchEnquiryWirePayload(cleanCmd: string, tokenParam?: string): Promise<unknown> {
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

  logger.debug(
    `[InquiryService] Outgoing gRPC Payload for "${cleanCmd}"`,
    payload,
    "INQUIRY_SERVICE",
  );

  const res = await grpcProcess(ctx.address, GRPC_SERVICE_CATEGORY, payload, {
    token: ctx.token,
  });

  logger.debug(`[InquiryService] Incoming gRPC Response for "${cleanCmd}"`, res, "INQUIRY_SERVICE");

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(
      `gRPC Enquiry fetch failed for ${cleanCmd} (${res.statusCode}): ${res.message || "No data"}`,
    );
  }

  return res.data;
}

async function fetchEnquiryRowsWirePayload(
  cleanCmd: string,
  tokenParam?: string,
): Promise<EnquiryRow[]> {
  try {
    const ctx = await resolveServiceContext(tokenParam);
    const payload = {
      idempotencyKey: "",
      clientId: ctx.clientId,
      requestType: CbsRequestType.INQ,
      controlName: cleanCmd,
      recordFunction: CbsRecordFunction.SEE,
      recordId: "",
      branchCode: ctx.branchCode,
      authLevel: DEFAULT_AUTH_LEVEL,
      userId: ctx.userId,
      data: {},
    };

    const res = await grpcProcess(ctx.address, GRPC_SERVICE_CATEGORY, payload, {
      token: ctx.token,
    });

    if (res.statusCode === 200 && res.data) {
      if (Array.isArray(res.data)) {
        return res.data as EnquiryRow[];
      }
      if (
        typeof res.data === "object" &&
        res.data !== null &&
        "data" in res.data &&
        Array.isArray((res.data as Record<string, unknown>).data)
      ) {
        return (res.data as Record<string, unknown>).data as EnquiryRow[];
      }
    }
    return [];
  } catch (err) {
    logger.warn(
      `[InquiryService] Could not preload inquiry records for "${cleanCmd}"`,
      err,
      "INQUIRY_SERVICE",
    );
    return [];
  }
}

/**
 * Retrieves the enquiry grid specification schema with dataset records for an inquiry command (cached in Redis).
 */
export async function getEnquiryData(
  command: string,
  token?: string,
): Promise<EnquirySchema | null> {
  const cleanCmd = normalizeCommand(command);

  return getOrSet(
    appConfig.redis.cacheKeys.inquirySpec(cleanCmd),
    async () => {
      const [wireData, rows] = await Promise.all([
        fetchEnquiryWirePayload(cleanCmd, token),
        fetchEnquiryRowsWirePayload(cleanCmd, token),
      ]);
      if (!wireData) return null;
      const parseResult = parseEnquiry(wireData, cleanCmd);
      if (!parseResult.success) return null;
      return {
        ...parseResult.data,
        sampleData: rows,
      };
    },
    appConfig.redis.specTtlSeconds,
  );
}
