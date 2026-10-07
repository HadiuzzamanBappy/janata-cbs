import { PAGE_SIZE_MM } from "../constants/pages";

/**
 * Unit-conversion helpers.
 *
 * The studio stores values in two different units depending on the surface:
 *
 *   - Zones (header / footer) — pt
 *   - Body rows / components  — mm
 *
 * Conversion is deferred to serialise time (`buildReportJson`) and the PDF
 * renderer; the canvas applies a single `canvasZoom` multiplier on top of
 * whichever raw unit a section uses.
 */

export const PT_TO_MM = 25.4 / 72; // ≈ 0.352778
export const MM_TO_PT = 72 / 25.4; // ≈ 2.834645

/**
 * Convert mm to pt, rounding to 2 decimal places to keep generated JSON tidy.
 *
 * Matches the monolith's `mmToPt` exactly — don't reduce precision here
 * unless you also revisit `buildReportJson`'s round-trip expectations.
 */
export function mmToPt(mm: number): number {
  return Math.round(mm * MM_TO_PT * 100) / 100;
}

/** Convert pt to mm. Symmetric inverse of `mmToPt` (without the rounding). */
export function ptMm(pt: number): number {
  return pt * PT_TO_MM;
}

/**
 * Page width in mm for a given (size, orientation) pair. Falls back to A4
 * when an unknown size is passed, matching the monolith.
 */
export function getPageWidthMm(size: string, orientation: string): number {
  const [w, h] = PAGE_SIZE_MM[size] || PAGE_SIZE_MM.A4;
  return orientation === "landscape" ? h : w;
}

/** Page height in mm. Same fallback semantics as `getPageWidthMm`. */
export function getPageHeightMm(size: string, orientation: string): number {
  const [w, h] = PAGE_SIZE_MM[size] || PAGE_SIZE_MM.A4;
  return orientation === "landscape" ? w : h;
}
