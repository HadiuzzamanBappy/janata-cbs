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
 * Clones the record data to isolate from subsequent in-memory mutations.
 */
export function createBaseline<T extends Record<string, unknown>>(
  record: T | null | undefined,
  ignoredKeys: string[] = [],
): RecordBaseline<T> {
  const clone = record ? (JSON.parse(JSON.stringify(record)) as T) : ({} as T);
  return {
    baseline: Object.freeze(clone),
    ignoredKeys: Object.freeze([...ignoredKeys]),
  };
}

/**
 * Evaluates whether working draft values are dirty relative to the established baseline.
 * Handles both a RecordBaseline container or direct baseline object.
 */
export function evaluateDirty<T extends Record<string, unknown>>(
  baselineHolder: RecordBaseline<T> | T | null | undefined,
  current: T | null | undefined,
  additionalIgnoredKeys: string[] = [],
): CbsDeltaPatch {
  let base: T;
  let ignored: string[];

  if (baselineHolder && typeof baselineHolder === "object" && "baseline" in baselineHolder) {
    base = (baselineHolder as RecordBaseline<T>).baseline;
    ignored = [
      ...((baselineHolder as RecordBaseline<T>).ignoredKeys || []),
      ...additionalIgnoredKeys,
    ];
  } else {
    base = (baselineHolder || {}) as T;
    ignored = additionalIgnoredKeys;
  }

  return computeDelta(base, current, ignored);
}

/**
 * Resets the baseline snapshot to the current working record.
 * Clears dirty state following a successful commit or re-fetch.
 */
export function rebaseline<T extends Record<string, unknown>>(
  current: T | null | undefined,
  ignoredKeys: string[] = [],
): RecordBaseline<T> {
  return createBaseline(current, ignoredKeys);
}
