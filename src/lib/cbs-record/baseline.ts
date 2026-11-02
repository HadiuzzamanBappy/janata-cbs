import { computeDelta } from "./delta-engine";
import type { CbsDeltaPatch } from "./types";

/* -------------------------------------------------------------------------- */
/* Canonical CBS Record Baseline Management                                   */
/* -------------------------------------------------------------------------- */

export interface RecordBaseline<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly baseline: T;
  readonly ignoredKeys: readonly string[];
}

/**
 * Creates an immutable baseline snapshot of a record.
 * Uses native structuredClone to isolate from subsequent in-memory mutations.
 */
export function createBaseline<T extends Record<string, unknown>>(
  record: T | null | undefined,
  ignoredKeys: readonly string[] = [],
): RecordBaseline<T> {
  const clone = record ? (structuredClone(record) as T) : ({} as T);
  return {
    baseline: Object.freeze(clone),
    ignoredKeys: Object.freeze([...ignoredKeys]),
  };
}

/**
 * Evaluates whether working draft values are dirty relative to the established baseline.
 * Handles both a RecordBaseline container or direct baseline record.
 */
export function evaluateDirty<T extends Record<string, unknown>>(
  baselineHolder: RecordBaseline<T> | T | null | undefined,
  current: T | null | undefined,
  additionalIgnoredKeys: readonly string[] = [],
): CbsDeltaPatch {
  if (baselineHolder && typeof baselineHolder === "object" && "baseline" in baselineHolder) {
    const holder = baselineHolder as RecordBaseline<T>;
    const ignored = [...holder.ignoredKeys, ...additionalIgnoredKeys];
    return computeDelta(holder.baseline, current, ignored);
  }

  return computeDelta(baselineHolder, current, additionalIgnoredKeys);
}

/**
 * Resets the baseline snapshot to the current working record.
 * Clears dirty state following a successful commit or re-fetch.
 */
export function rebaseline<T extends Record<string, unknown>>(
  current: T | null | undefined,
  ignoredKeys: readonly string[] = [],
): RecordBaseline<T> {
  return createBaseline(current, ignoredKeys);
}
