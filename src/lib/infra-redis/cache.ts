import "server-only";

import { appConfig } from "@/lib/core-config/server";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import { cacheDelete, cacheGet, cacheKey, cacheSet, circuitOpen } from "./client";

const DEFAULT_TTL_SECONDS = appConfig.redis.defaultTtlSeconds;

/* -------------------------------------------------------------------------- */
/* Cache Key & Specification Descriptor Resolution                            */
/* -------------------------------------------------------------------------- */

export interface CacheDescriptorTarget {
  requestType: string;
  controlName?: string | null;
  recordFunction?: string | null;
  recordId?: string | null;
}

/**
 * Resolves cache key and TTL for read-only specification/catalog requests.
 * Returns null for transactional mutations or runtime query data.
 */
export function resolveCacheDescriptor(
  target: CacheDescriptorTarget,
): { key: string; ttl: number } | null {
  const isReadOperation =
    target.requestType === CbsRequestType.GET ||
    target.requestType === CbsRequestType.GFC ||
    target.requestType === CbsRequestType.GMC ||
    target.requestType === CbsRequestType.GRL ||
    target.requestType === CbsRequestType.GUM ||
    target.recordFunction === CbsRecordFunction.SEE ||
    target.recordFunction === CbsRecordFunction.LIST;

  if (!isReadOperation) return null;

  const ctrl = (target.controlName || "").toUpperCase().trim();
  const recordId = (target.recordId || "").trim();

  // 1. Dynamic Form Layout Spec: cbs:spec:<RECORD_ID>
  if (ctrl === CbsControlTable.FORM_CONFIG || target.requestType === CbsRequestType.GFC) {
    const specTarget = recordId || ctrl;
    return {
      key: appConfig.redis.cacheKeys.formSpec(specTarget),
      ttl: appConfig.redis.specTtlSeconds,
    };
  }

  // 2. Data Model Config Spec: cbs:spec:model:<RECORD_ID>
  if (ctrl === CbsControlTable.MODEL_CONFIG || target.requestType === CbsRequestType.GMC) {
    const modelTarget = recordId || ctrl;
    return {
      key: `spec:model:${modelTarget}`,
      ttl: appConfig.redis.specTtlSeconds,
    };
  }

  // 3. Navigation Menu Trees & Catalogs: cbs:menu:<NAME>
  if (
    ctrl === CbsControlTable.MENU ||
    ctrl === CbsControlTable.MENU_TREE ||
    target.requestType === CbsRequestType.GUM
  ) {
    const menuTarget = recordId || "MAIN";
    return {
      key: appConfig.redis.cacheKeys.menu(menuTarget),
      ttl: appConfig.redis.menuTtlSeconds,
    };
  }

  // 4. Branch Directory: cbs:branches:directory
  if (ctrl === CbsControlTable.BRANCH) {
    return {
      key: appConfig.redis.cacheKeys.branches,
      ttl: appConfig.redis.specTtlSeconds,
    };
  }

  // 5. Inquiry Table Configuration Definition: cbs:spec:enq:<RECORD_ID>
  if (ctrl === CbsControlTable.INQUIRY_CONFIG && target.requestType !== CbsRequestType.INQ) {
    const inqTarget = recordId || ctrl;
    return {
      key: appConfig.redis.cacheKeys.inquirySpec(inqTarget),
      ttl: appConfig.redis.specTtlSeconds,
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
      ctrl === CbsControlTable.MENU ||
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

  if (appConfig.redis.enabled && !circuitOpen()) {
    const cached = await cacheGet<T>(fullKey);
    if (cached !== null) return cached;
  }

  // Use single-flight pattern to collapse concurrent cold cache hits
  return singleFlight(fullKey, async () => {
    const freshData = await fetcher();
    if (appConfig.redis.enabled && !circuitOpen() && freshData) {
      await cacheSet(fullKey, freshData, ttlSeconds);
    }
    return freshData;
  });
}

/**
 * Invalidation hook to clear all or specific model schema caches.
 * Matches keys generated by `appConfig.redis.cacheKeys`.
 */
export async function invalidateCache(controlName?: string): Promise<number> {
  if (controlName) {
    const cleanCmd = controlName.trim().toUpperCase();
    const specPattern = cacheKey(appConfig.redis.cacheKeys.formSpec(`${cleanCmd}*`));
    const enqPattern = cacheKey(appConfig.redis.cacheKeys.inquirySpec(`${cleanCmd}*`));
    const menuKey = cacheKey(appConfig.redis.cacheKeys.menu(cleanCmd));
    const [specDel, enqDel, menuDel] = await Promise.all([
      cacheDelete(specPattern),
      cacheDelete(enqPattern),
      cacheDelete(menuKey),
    ]);
    return specDel + enqDel + menuDel;
  }

  // Delete all keys matching key prefix pattern (cbs:*)
  const pattern = cacheKey("*");
  return cacheDelete(pattern);
}
