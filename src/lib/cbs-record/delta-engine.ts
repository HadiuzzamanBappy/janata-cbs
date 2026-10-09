import type { CbsDeltaPatch } from "./types";

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);

  if (keysA.length !== keysB.length) return false;

  for (const k of keysA) {
    if (!Object.hasOwn(b, k)) return false;
    if (!isEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) {
      return false;
    }
  }

  return true;
}

/**
 * Computes changed delta fields between baseline record and current working draft.
 * Used across banking screens to ensure commit payloads only transmit touched fields.
 */
export function computeDelta<T extends Record<string, unknown>>(
  original: T | null | undefined,
  current: T | null | undefined,
  ignoredKeys: string[] = [],
): CbsDeltaPatch {
  const orig = original || ({} as T);
  const curr = current || ({} as T);

  const modifiedFields: Record<string, unknown> = {};
  const originalFields: Record<string, unknown> = {};
  const dirtyKeys: string[] = [];

  const allKeys = new Set([...Object.keys(orig), ...Object.keys(curr)]);
  const ignoreSet = new Set(ignoredKeys);

  for (const key of allKeys) {
    if (ignoreSet.has(key)) continue;

    const valOrig = orig[key];
    const valCurr = curr[key];

    if (!isEqual(valOrig, valCurr)) {
      dirtyKeys.push(key);
      modifiedFields[key] = valCurr;
      originalFields[key] = valOrig;
    }
  }

  return {
    modifiedFields,
    originalFields,
    dirtyKeys,
    isDirty: dirtyKeys.length > 0,
  };
}
