import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { parseMNU } from "@/lib/data-parsers";
import type { MenuItem } from "@/lib/data-schemas";
import { grpcProcess } from "@/lib/infra-grpc";
import { getOrSet } from "@/lib/infra-redis";
import { CbsRecordFunction, CbsRequestType } from "@/types";
import {
  DEFAULT_AUTH_LEVEL,
  GRPC_SERVICE_CATEGORY,
  resolveServiceContext,
} from "./service-context";

const log = logger.withContext("MENU_SERVICE");

async function fetchMenuWirePayload(controlName: string, tokenParam?: string): Promise<unknown> {
  const ctx = await resolveServiceContext(tokenParam);
  const payload = {
    idempotencyKey: "",
    clientId: ctx.clientId,
    requestType: CbsRequestType.GUM,
    controlName,
    recordFunction: CbsRecordFunction.LIST,
    recordId: "",
    branchCode: ctx.branchCode,
    authLevel: DEFAULT_AUTH_LEVEL,
    userId: ctx.userId,
    data: {},
  };

  log.info(`Outgoing gRPC Payload for MENU "${controlName || "DEFAULT"}"`, payload);

  const res = await grpcProcess(ctx.address, GRPC_SERVICE_CATEGORY, payload, {
    token: ctx.token,
  });

  log.info(`Incoming gRPC Response for MENU "${controlName || "DEFAULT"}"`, res);

  if (res.statusCode !== 200 || !res.data) {
    log.error(`gRPC menu fetch failed (${res.statusCode}): ${res.message || "No data"}`);
    throw new Error(`gRPC menu fetch failed (${res.statusCode}): ${res.message || "No data"}`);
  }

  return res.data;
}

/**
 * Retrieves the CBS application navigation menu tree for the current user (cached in Redis).
 */
export async function getMenuData(token?: string, controlName: string = ""): Promise<MenuItem[]> {
  return getOrSet(
    appConfig.redis.cacheKeys.menu(controlName),
    async () => {
      const wireData = await fetchMenuWirePayload(controlName, token);
      const parseResult = parseMNU(wireData);
      if (!parseResult.success) {
        log.error(`Failed to parse menu "${controlName || "DEFAULT"}": ${parseResult.error}`, wireData);
        throw new Error(`Failed to parse menu: ${parseResult.error}`);
      }
      return parseResult.data;
    },
    appConfig.redis.menuTtlSeconds,
  );
}
