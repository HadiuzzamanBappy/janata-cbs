/**
 * @fileoverview 12-Column Responsive Grid Spans & High-Density Input Widths
 * @module cbs-form-spec/layout-grid
 *
 * Core Invariants:
 * - Maps semantic width tokens ("xs".."full") to cell spans in 1 to 4 column grids and input max-width caps.
 * - Enforces compact banking density to prevent inputs from over-stretching across wide monitors.
 * - Single row fallback (cols <= 1) assigns full row span ("w-full col-span-1") to all fields.
 */

import { INLINE_WIDTH_WIDGETS, type SemanticWidthToken } from "@/lib/data-schemas";
import { deriveSemanticWidth } from "./field-normalizer";

/**
 * Maps semantic width tokens to high-density input element width classes.
 * Enforces CBS compact density caps instead of unbounded stretching:
 * - xs:   ~112px (max-w-28) - branch codes, flags, prefixes
 * - sm:   ~176px (max-w-44) - account numbers, short codes
 * - md:   ~288px (max-w-72) - amounts, rates, dropdowns
 * - lg:   ~448px (max-w-md) - customer titles, names
 * - xl:   ~576px (max-w-xl) - street addresses, company names
 * - xxl:  ~672px (max-w-2xl) - long descriptions
 * - full: 100%   (w-full) - textareas, remarks
 */
export const SEMANTIC_INPUT_WIDTH_CLASSES: Record<SemanticWidthToken, string> = {
  xs: "w-full sm:max-w-28",
  sm: "w-full sm:max-w-44",
  md: "w-full sm:max-w-72",
  lg: "w-full sm:max-w-md",
  xl: "w-full sm:max-w-xl",
  xxl: "w-full sm:max-w-2xl",
  full: "w-full",
};

// ─────────────────────────────────────────────────────────────────────────────
// Input Width & Grid Layout Class Resolvers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the compact CSS width class for an input element based on widget type and token.
 *
 * @param width Explicit property width override.
 * @param length Physical DB column character length.
 * @param type Physical column type.
 * @param widget Form widget identifier (e.g. "switch", "date", "time").
 * @returns Tailwind CSS width utility string.
 */
export function getInputWidthClass(
  width?: SemanticWidthToken,
  length?: number,
  type?: string,
  widget?: string,
): string {
  if (widget && INLINE_WIDTH_WIDGETS.has(widget)) return "w-auto";
  if (widget === "date") {
    return "w-full sm:max-w-44";
  }
  if (widget === "time") {
    return "w-full sm:max-w-36";
  }
  if (widget === "datetime") {
    return "w-full sm:max-w-56";
  }

  const token = deriveSemanticWidth(width, length, type);
  return SEMANTIC_INPUT_WIDTH_CLASSES[token] || "w-full sm:max-w-72";
}

/**
 * Maps a section's column count (1 to 4) to responsive Tailwind CSS grid classes.
 *
 * @param cols Configured columns for the section.
 * @returns Responsive grid column class string.
 */
export function getGridColsClass(cols?: number): string {
  switch (cols) {
    case 2:
      return "grid-cols-1 md:grid-cols-2";
    case 3:
      return "grid-cols-1 md:grid-cols-3";
    case 4:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    default:
      return "grid-cols-1";
  }
}

/**
 * Returns the column span class for a field cell within a container grid.
 * - cols <= 1: Full-width single column ("w-full col-span-1").
 * - cols in (2, 3, 4): Proportional responsive spans based on derived tokens.
 *
 * @param cols Grid column count of the enclosing section.
 * @param width Explicit property width.
 * @param length Physical DB column length.
 * @param type Physical column type.
 * @returns Tailwind column span class string.
 */
export function getFieldColSpanClass(
  cols: number = 1,
  width?: SemanticWidthToken,
  length?: number,
  type?: string,
): string {
  if (cols <= 1) {
    return "w-full col-span-1";
  }

  const token = deriveSemanticWidth(width, length, type);
  if (token === "full") {
    return "col-span-full w-full";
  }

  if (cols === 2) {
    return token === "xl" || token === "xxl"
      ? "col-span-1 md:col-span-2 w-full"
      : "col-span-1 w-full";
  }

  if (cols === 3) {
    if (token === "xl" || token === "xxl") return "col-span-1 md:col-span-3 w-full";
    if (token === "lg") return "col-span-1 md:col-span-2 w-full";
    return "col-span-1 w-full";
  }

  if (cols === 4) {
    if (token === "xxl") return "col-span-1 md:col-span-2 lg:col-span-4 w-full";
    if (token === "xl") return "col-span-1 md:col-span-2 lg:col-span-3 w-full";
    if (token === "lg") return "col-span-1 md:col-span-2 w-full";
    return "col-span-1 w-full";
  }

  return "col-span-1 w-full";
}
