/**
 * Canonical Web Storage access for the workbench (F2-5).
 * The single place that touches `localStorage` / `sessionStorage`: every call is SSR-safe and
 * swallows quota, privacy-mode and disabled-storage errors, so callers never need try/catch.
 */
import type { z } from "zod";
import { logger } from "@/lib/core-logger";

export type CbsStorageArea = "local" | "session";

const storageLogger = logger.withContext("STORAGE");

function resolveArea(area: CbsStorageArea): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null; // Access itself throws when storage is disabled by browser policy
  }
}

export const cbsStorage = {
  /** Reads a raw string value, or null when absent or storage is unavailable. */
  get(area: CbsStorageArea, key: string): string | null {
    try {
      return resolveArea(area)?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },

  /** Writes a raw string value. Failures (quota, privacy mode) are logged, never thrown. */
  set(area: CbsStorageArea, key: string, value: string): void {
    try {
      resolveArea(area)?.setItem(key, value);
    } catch (err) {
      storageLogger.warn(`Failed to write "${key}" to ${area} storage`, err);
    }
  },

  /** Removes one or more keys. */
  remove(area: CbsStorageArea, ...keys: string[]): void {
    const store = resolveArea(area);
    for (const key of keys) {
      try {
        store?.removeItem(key);
      } catch {
        // Removal of an inaccessible key is a no-op
      }
    }
  },

  /** Reads and JSON-parses a value; with a schema, returns null unless it validates. */
  readJson<T>(area: CbsStorageArea, key: string, schema?: z.ZodType<T>): T | null {
    const raw = cbsStorage.get(area, key);
    if (raw === null) return null;
    try {
      const value: unknown = JSON.parse(raw);
      if (!schema) return value as T;
      const parsed = schema.safeParse(value);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  },

  /** JSON-serializes and writes a value. */
  writeJson(area: CbsStorageArea, key: string, value: unknown): void {
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch (err) {
      storageLogger.warn(`Failed to serialize "${key}" for ${area} storage`, err);
      return;
    }
    cbsStorage.set(area, key, serialized);
  },
};
