import { hashString } from "./id";

/**
 * Mulberry32 — a tiny seeded PRNG. Returns a function that produces values in
 * `[0, 1)` from a 32-bit integer seed.
 *
 * Used by `mockValuesForSeries` (and by the chart preview indirectly) so the
 * fake bars/lines drawn behind a series are *stable across rerenders* for
 * the same series key, but vary between series. Without that stability the
 * canvas flickers every time the user nudges a slider.
 */
export function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate `count` mock values seeded by `seriesKey`. Values land in
 * `[15, 95]` so previews look "realistic" without saturating the chart's
 * full vertical range.
 */
export function mockValuesForSeries(seriesKey: string, count: number): number[] {
  const rand = seededRand(hashString(seriesKey) || 1);
  return Array.from({ length: count }, () => Math.round(15 + rand() * 80));
}
