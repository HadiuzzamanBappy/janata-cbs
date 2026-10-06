/**
 * ID + small-hash helpers. Both functions return values that are stable for
 * the same input (in `hashString`'s case) or sufficiently random for in-memory
 * uniqueness (`uid`).
 */

/**
 * Random alphanumeric ID. ~7 chars from `[0-9a-z]`.
 *
 * Collision-rate is fine for the studio's runtime use (a single report rarely
 * has more than a few hundred elements) but DO NOT use it for anything that
 * crosses a network boundary or persists across sessions — use a real UUID
 * for those cases.
 *
 * The monolith called this `generateId`; both names are exported so existing
 * call sites keep working as features migrate over.
 */
export const uid = (): string => Math.random().toString(36).slice(2, 9);

/** Legacy alias preserved during migration. Prefer `uid` in new code. */
export const generateId = uid;

/**
 * 32-bit FNV-1a hash of a string. Used by `utils/rand.seededRand` so that the
 * mock values rendered behind a series are stable across rerenders for the
 * same series key, but vary between series.
 */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
