import "server-only";

import { serverConfig } from "@/lib/core-config/server";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import { cacheDelete, cacheGet, cacheKey, cacheSet, circuitOpen } from "./client";

const DEFAULT_TTL_SECONDS = serverConfig.redis.defaultTtlSeconds;

/* -------------------------------------------------------------------------- */
/* Cache Key & Specification Descriptor Resolution                            */
/* -------------------------------------------------------------------------- */

export interface CacheDescriptorTarget {
  requestType: string;
  controlName?: string | null;
  recordFunction?: string | null;
  recordId?: string | null;
  userId?: string | null;
}

/**
 * Resolves cache key and TTL for read-only specification/catalog requests.
 * Returns null for transactional mutations or runtime query data.
 *
 * CACHING PRINCIPLE:
 * - Dynamic operations, searches, and record lists (GRL, SBI, INQ, LIST) are NEVER cached.
 *   They represent operational database state and must always be a fresh fetch.
 * - Only immutable/semi-static specifications with a specific recordId (Model Configs,
 *   Form Layouts, Inquiry column definitions, and active Navigation Menu Trees) are cached.
 */
export function resolveCacheDescriptor(
  target: CacheDescriptorTarget,
): { key: string; ttl: number } | null {
  // 1. Dynamic lists, inquiries, and searches are NEVER cached — always fresh fetch
  if (
    target.requestType === CbsRequestType.SBI ||
    target.requestType === CbsRequestType.GRL ||
    target.requestType === CbsRequestType.INQ ||
    target.recordFunction === CbsRecordFunction.LIST
  ) {
    return null;
  }

  const isReadOperation =
    target.requestType === CbsRequestType.GET ||
    target.requestType === CbsRequestType.GFC ||
    target.requestType === CbsRequestType.GMC ||
    target.requestType === CbsRequestType.GUM ||
    target.recordFunction === CbsRecordFunction.SEE;

  if (!isReadOperation) return null;

  const ctrl = (target.controlName || "").toUpperCase().trim();
  const recordId = (target.recordId || "").trim();

  // Dynamic collections without an explicit recordId are NEVER cached
  if (!recordId && target.requestType !== CbsRequestType.GUM) {
    return null;
  }

  // 1. Dynamic Form Layout Spec: cbs:spec:<RECORD_ID>
  if (ctrl === CbsControlTable.FORM_CONFIG || target.requestType === CbsRequestType.GFC) {
    return {
      key: serverConfig.redis.cacheKeys.formSpec(recordId),
      ttl: serverConfig.redis.specTtlSeconds,
    };
  }

  // 2. Data Model Config Spec: cbs:spec:model:<RECORD_ID>
  if (ctrl === CbsControlTable.MODEL_CONFIG || target.requestType === CbsRequestType.GMC) {
    return {
      key: `spec:model:${recordId}`,
      ttl: serverConfig.redis.specTtlSeconds,
    };
  }

  // 3. User Navigation Menu Tree (GUM): cbs:menu:user:<USER_ID> or specific tree
  if (target.requestType === CbsRequestType.GUM || ctrl === CbsControlTable.MENU_TREE) {
    const treeTarget = recordId || (target.userId ? `user:${target.userId}` : "user");
    return {
      key: serverConfig.redis.cacheKeys.menu(treeTarget),
      ttl: serverConfig.redis.menuTtlSeconds,
    };
  }

  // 4. Inquiry Table Configuration Definition: cbs:spec:enq:<RECORD_ID>
  if (ctrl === CbsControlTable.INQUIRY_CONFIG) {
    return {
      key: serverConfig.redis.cacheKeys.inquirySpec(recordId),
      ttl: serverConfig.redis.specTtlSeconds,
    };
  }

  return null;
}

/**
 * Checks if a transaction is a schema/configuration mutation and invalidates corresponding cache keys.
 */
export async function autoInvalidateOnMutation(target: {
  requestType: string;
  controlName?: string | null;
  recordFunction?: string | null;
  recordId?: string | null;
  data?: unknown;
}): Promise<number> {
  const ctrl = (target.controlName || "").toUpperCase();
  const isMutationOrAuth =
    target.requestType === CbsRequestType.PUT ||
    target.requestType === CbsRequestType.AUT ||
    target.recordFunction === CbsRecordFunction.INPUT ||
    target.recordFunction === CbsRecordFunction.AUTHORIZE;

  if (
    isMutationOrAuth &&
    (ctrl === CbsControlTable.MODEL_CONFIG ||
      ctrl === CbsControlTable.FORM_CONFIG ||
      ctrl === CbsControlTable.INQUIRY_CONFIG ||
      ctrl === CbsControlTable.MENU_TREE)
  ) {
    const payloadData = target.data as Record<string, unknown> | undefined;
    const targetModel =
      (payloadData?.targetModel as string) ||
      (payloadData?.tableName as string) ||
      target.recordId ||
      "";
    if (targetModel.trim()) {
      return await invalidateCache(targetModel.trim());
    }
  }

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Concurrency: Single-Flight Request Deduplication                           */
/* -------------------------------------------------------------------------- */

const inflight = new Map<string, Promise<unknown>>();

/**
 * Collapses concurrent requests for the same key into a single underlying fetch execution.
 */
export function singleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = run().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/* -------------------------------------------------------------------------- */
/* Read-Through Caching API                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Gets a cached item by key or executes the fetcher function on miss / circuit trip.
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<T> {
  const fullKey = cacheKey(key);

  if (serverConfig.redis.enabled && !circuitOpen()) {
    const cached = await cacheGet<T>(fullKey);
    if (cached !== null) return cached;
  }

  // Use single-flight pattern to collapse concurrent cold cache hits
  return singleFlight(fullKey, async () => {
    const freshData = await fetcher();
    if (serverConfig.redis.enabled && !circuitOpen() && freshData) {
      await cacheSet(fullKey, freshData, ttlSeconds);
    }
    return freshData;
  });
}

/**
 * Invalidation hook to clear all or specific model schema caches.
 * Matches keys generated by `serverConfig.redis.cacheKeys`.
 */
export async function invalidateCache(controlName?: string): Promise<number> {
  if (controlName) {
    const cleanCmd = controlName.trim().toUpperCase();
    const specPattern = cacheKey(serverConfig.redis.cacheKeys.formSpec(`${cleanCmd}*`));
    const enqPattern = cacheKey(serverConfig.redis.cacheKeys.inquirySpec(`${cleanCmd}*`));
    const menuKey = cacheKey(serverConfig.redis.cacheKeys.menu(`${cleanCmd}*`));
    const [specDel, enqDel, menuDel, userDel] = await Promise.all([
      cacheDelete(specPattern),
      cacheDelete(enqPattern),
      cacheDelete(menuKey),
      cacheDelete(cacheKey(serverConfig.redis.cacheKeys.menu("user*"))),
    ]);
    return specDel + enqDel + menuDel + userDel;
  }

  // Delete all keys matching key prefix pattern (cbs:*)
  const pattern = cacheKey("*");
  return cacheDelete(pattern);
}
