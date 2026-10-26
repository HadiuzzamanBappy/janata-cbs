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

const log = logger.withContext("INQUIRY_SERVICE");

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

  log.info(`Outgoing gRPC Payload for "${cleanCmd}"`, payload);

  const res = await grpcProcess(ctx.address, GRPC_SERVICE_CATEGORY, payload, {
    token: ctx.token,
  });

  log.info(`Incoming gRPC Response for "${cleanCmd}"`, res);

  if (res.statusCode !== 200 || !res.data) {
    log.error(`gRPC Enquiry fetch failed for ${cleanCmd} (${res.statusCode}): ${res.message || "No data"}`);
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
    log.warn(
      `Could not preload inquiry records for "${cleanCmd}"`,
      err,
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
      if (!parseResult.success) {
        log.error(`parseEnquiry failed for "${cleanCmd}"`, parseResult.error);
        return null;
      }
      return {
        ...parseResult.data,
        sampleData: rows,
      };
    },
    appConfig.redis.specTtlSeconds,
  );
}
