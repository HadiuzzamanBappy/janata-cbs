import "server-only";

import { serverConfig, serviceNameOf } from "@/lib/core-config/server";
import { DEFAULT_SERVICE } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType, isCbsMutationRequest } from "@/types";
import {
  cacheDelete,
  cacheGet,
  cacheKey,
  cacheSet,
  circuitOpen,
  deleteKeysMatching,
  SPEC_CACHE_PATTERNS,
} from "./client";

/* -------------------------------------------------------------------------- */
/* Declarative Domain Specification Policies                                  */
/* -------------------------------------------------------------------------- */

export interface CacheDescriptorTarget {
  requestType: string;
  controlName?: string | null;
  recordFunction?: string | null;
  recordId?: string | null;
  userId?: string | null;
  servicePath?: string | null;
}

interface SpecCachePolicy {
  resolveKey: (id: string, target: CacheDescriptorTarget) => string;
  ttlSeconds: number;
  requiresRecordId: boolean;
}

const { cacheKeys, specTtlSeconds, menuTtlSeconds } = serverConfig.redis;

const SPEC_POLICIES: Readonly<Record<string, SpecCachePolicy>> = {
  [CbsControlTable.FORM_CONFIG]: {
    resolveKey: (id) => cacheKeys.formSpec(id),
    ttlSeconds: specTtlSeconds,
    requiresRecordId: true,
  },
  [CbsControlTable.MODEL_CONFIG]: {
    resolveKey: (id) => cacheKeys.modelSpec(id),
    ttlSeconds: specTtlSeconds,
    requiresRecordId: true,
  },
  [CbsControlTable.INQUIRY_CONFIG]: {
    resolveKey: (id) => cacheKeys.inquirySpec(id),
    ttlSeconds: specTtlSeconds,
    requiresRecordId: true,
  },
  [CbsControlTable.MENU_TREE]: {
    resolveKey: (id, target) =>
      cacheKeys.menu(id || (target.userId ? `user:${target.userId}` : "user")),
    ttlSeconds: menuTtlSeconds,
    requiresRecordId: false,
  },
  [CbsControlTable.MENU]: {
    resolveKey: (id, target) =>
      cacheKeys.menu(id || (target.userId ? `user:${target.userId}` : "user")),
    ttlSeconds: menuTtlSeconds,
    requiresRecordId: false,
  },
};

const INVALIDATABLE_CONTROLS: ReadonlySet<string> = new Set<string>([
  CbsControlTable.MODEL_CONFIG,
  CbsControlTable.FORM_CONFIG,
  CbsControlTable.INQUIRY_CONFIG,
  CbsControlTable.MENU_TREE,
  CbsControlTable.MENU,
]);

const MUTATION_RECORD_FUNCTIONS: ReadonlySet<string> = new Set<string>([
  CbsRecordFunction.INPUT,
  CbsRecordFunction.AUTHORIZE,
  CbsRecordFunction.DELETE,
  CbsRecordFunction.REVERSE,
]);

/* -------------------------------------------------------------------------- */
/* Cache Key & Specification Descriptor Resolution                            */
/* -------------------------------------------------------------------------- */

/**
 * Resolves cache key and TTL for read-only specification/catalog requests.
 * Returns null for transactional mutations or runtime query data.
 */
export function resolveCacheDescriptor(
  target: CacheDescriptorTarget,
): { key: string; ttl: number } | null {
  const reqType = (target.requestType || "").toUpperCase().trim();
  const recFunc = (target.recordFunction || "").toUpperCase().trim();

  // 0. Spec keys carry no service, and spec tables live on the core: cache only the core's reads
  if (serviceNameOf(target.servicePath) !== DEFAULT_SERVICE) return null;

  // 1. Invariant: Mutations, searches, and runtime query data are strictly non-cacheable
  if (
    isCbsMutationRequest(reqType) ||
    recFunc === CbsRecordFunction.LIST ||
    reqType === CbsRequestType.INQ ||
    reqType === CbsRequestType.SBI ||
    reqType === CbsRequestType.GRL
  ) {
    return null;
  }

  // 2. Maintenance reads (I/A/H/R/D) may resolve the pending INAU copy, and the cache key
  //    carries no record function — caching them would leak drafts into live SEE reads.
  if (recFunc && recFunc !== CbsRecordFunction.SEE) return null;

  // 3. Must be a read intent (SEE or GET)
  const isRead = recFunc === CbsRecordFunction.SEE || reqType === CbsRequestType.GET;
  if (!isRead) return null;

  // 4. Resolve canonical domain control table
  const ctrl = (target.controlName || "").toUpperCase().trim();
  const policy = SPEC_POLICIES[ctrl];
  if (!policy) return null;

  const recordId = (target.recordId || "").trim();
  if (policy.requiresRecordId && !recordId) return null;

  return { key: policy.resolveKey(recordId, target), ttl: policy.ttlSeconds };
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
  const reqType = (target.requestType || "").toUpperCase().trim();
  if (reqType === CbsRequestType.GNI) return 0; // Get New ID is a read sequence, never a mutation

  const ctrl = (target.controlName || "").toUpperCase().trim();
  if (!INVALIDATABLE_CONTROLS.has(ctrl)) return 0;

  const recFunc = (target.recordFunction || "").toUpperCase().trim();
  if (!isCbsMutationRequest(reqType) && !MUTATION_RECORD_FUNCTIONS.has(recFunc)) {
    return 0;
  }

  const payload = target.data as Record<string, unknown> | undefined;
  const targetId = (
    (payload?.TABLENAME as string) ||
    (payload?.formId as string) ||
    (payload?.inquiryId as string) ||
    (payload?.targetModel as string) ||
    target.recordId ||
    ""
  )
    .trim()
    .toUpperCase();

  if (targetId) {
    return invalidateCache(targetId);
  }

  if (ctrl === CbsControlTable.MENU_TREE || ctrl === CbsControlTable.MENU) {
    return cacheDelete(cacheKey(cacheKeys.menu("*")));
  }

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Concurrency & Read-Through API                                             */
/* -------------------------------------------------------------------------- */

const inflight = new Map<string, Promise<unknown>>();

/**
 * Collapses concurrent requests for the same key into a single underlying fetch execution.
 */
function singleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = run().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/**
 * Gets a cached item by key or executes the fetcher function on miss / circuit trip.
 * Concurrent misses share one fetch and all receive its result; only results that pass
 * `shouldCache` are stored, so failures are returned but never cached.
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = serverConfig.redis.defaultTtlSeconds,
  shouldCache: (value: T) => boolean = (value) => value != null,
): Promise<T> {
  const fullKey = cacheKey(key);

  if (serverConfig.redis.enabled && !circuitOpen()) {
    const cached = await cacheGet<T>(fullKey);
    if (cached !== null) return cached;
  }

  return singleFlight(fullKey, async () => {
    const freshData = await fetcher();
    if (serverConfig.redis.enabled && !circuitOpen() && shouldCache(freshData)) {
      await cacheSet(fullKey, freshData, ttlSeconds);
    }
    return freshData;
  });
}

/**
 * Invalidation hook to clear all or specific model/form/inquiry/menu schema caches.
 */
export async function invalidateCache(controlName?: string): Promise<number> {
  if (controlName) {
    const cleanCmd = controlName.trim().toUpperCase();
    const patterns = [
      cacheKey(cacheKeys.formSpec(`${cleanCmd}*`)),
      cacheKey(cacheKeys.modelSpec(`${cleanCmd}*`)),
      cacheKey(cacheKeys.inquirySpec(`${cleanCmd}*`)),
      cacheKey(cacheKeys.menu(`${cleanCmd}*`)),
      cacheKey(cacheKeys.menu("user*")),
    ];
    return deleteKeysMatching(patterns);
  }

  // "All" means every spec and menu key, never sessions or rate-limit counters.
  return deleteKeysMatching(SPEC_CACHE_PATTERNS);
}
