import type { PropertyWidth, SemanticWidthToken } from "@/lib/data-schemas/form-engine-schema";

// Re-export RenderBlock and buildRenderBlocks from headless library for backward-compatibility if needed
export { buildRenderBlocks, type RenderBlock } from "@/lib/cbs-form-spec";

/**
 * Maps semantic width tokens or fallback physical lengths to Tailwind 12-column span classes.
 * - xs:  2 cols  (col-span-12 md:col-span-2)
 * - sm:  3 cols  (col-span-12 md:col-span-3)
 * - md:  4 cols  (col-span-12 md:col-span-4)
 * - lg:  6 cols  (col-span-12 md:col-span-6)
 * - xl:  8 cols  (col-span-12 md:col-span-8)
 * - xxl: 10 cols (col-span-12 md:col-span-10)
 * - full: 12 cols (col-span-12)
 */
const TOKEN_TO_COL_SPAN: Record<SemanticWidthToken, string> = {
  xs: "col-span-12 md:col-span-2",
  sm: "col-span-12 md:col-span-3",
  md: "col-span-12 md:col-span-4",
  lg: "col-span-12 md:col-span-6",
  xl: "col-span-12 md:col-span-8",
  xxl: "col-span-12 md:col-span-10",
  full: "col-span-12",
};

/**
 * Maps semantic width tokens to high-density input element width classes.
 * Ensures compact banking density instead of inputs stretching across widescreen monitors.
 * - xs:   ~112px (max-w-28) - flags, prefix, branch code
 * - sm:   ~176px (max-w-44) - account no, dates, short codes
 * - md:   ~288px (max-w-72) - amounts, rates, dropdowns, ids
 * - lg:   ~448px (max-w-md) - customer name, titles
 * - xl:   ~576px (max-w-xl) - street address, organization name
 * - xxl:  ~672px (max-w-2xl) - long descriptions
 * - full: 100%   (w-full) - textareas, remarks, multi-line narratives
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

/**
 * Fallback mapping from physical DB LENGTH or type to semantic token.
 * Ignores any legacy DB numbers in Model Config and calculates purely from physical length and type.
 */
export function deriveSemanticWidth(
  width?: PropertyWidth | number,
  length?: number,
  type?: string,
): SemanticWidthToken {
  // 1. If explicit semantic token string, use directly
  if (typeof width === "string" && width in TOKEN_TO_COL_SPAN) {
    return width as SemanticWidthToken;
  }

  // 2. Type-based default hints
  const normType = (type || "").toLowerCase();
  if (normType === "textarea") return "full";
  if (normType === "boolean" || normType === "switch" || normType === "checkbox") return "xs";
  if (normType === "date" || normType === "datetime") return "sm";
  if (normType === "amount" || normType === "rate" || normType === "number") return "sm";

  // 3. Fallback derivation solely based on physical DB length
  // Single-line inputs cap comfortably at xxl (max-w-2xl) instead of stretching
  // across the full widescreen terminal. Only textareas take "full" (100% width).
  if (typeof length === "number" && length > 0) {
    if (length <= 6) return "xs";
    if (length <= 16) return "sm";
    if (length <= 40) return "md";
    if (length <= 80) return "lg";
    if (length <= 150) return "xl";
    return "xxl";
  }

  // 4. Default to standard medium width
  return "md";
}

/**
 * Returns the CSS class for an input element based on its semantic width token.
 */
export function getInputWidthClass(
  width?: PropertyWidth | number,
  length?: number,
  type?: string,
  widget?: string,
): string {
  if (
    widget === "switch" ||
    widget === "checkbox" ||
    widget === "radio" ||
    widget === "radio-group" ||
    widget === "checkbox-group" ||
    widget === "segmented"
  ) {
    return "w-auto";
  }
  if (widget === "date") {
    return "w-full sm:max-w-44";
  }
  if (widget === "datetime") {
    return "w-full sm:max-w-56";
  }

  const token = deriveSemanticWidth(width, length, type);
  return SEMANTIC_INPUT_WIDTH_CLASSES[token] || "w-full sm:max-w-72";
}

export function getGridColsClass(cols?: number): string {
  switch (cols) {
    case 2:
      return "grid-cols-1 md:grid-cols-2";
    case 3:
      return "grid-cols-1 md:grid-cols-3";
    case 4:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    case 12:
      return "grid-cols-12";
    default:
      return "grid-cols-1";
  }
}

/**
 * Returns the Tailwind column span class for a section's grid.
 * When cols <= 1 (default banking single row layout), every field factory takes the full row ("w-full").
 * When cols === 12, uses 12-column token spans (xs..full).
 * When cols is 2, 3, or 4, maps width to proportional column spans.
 */
export function getFieldColSpanClass(
  cols: number = 1,
  width?: PropertyWidth | number,
  length?: number,
  type?: string,
): string {
  // Single row layout default: Every field factory blocks its own full row!
  if (cols <= 1) {
    return "w-full col-span-1";
  }

  // Explicit 12-column grid mode
  if (cols === 12) {
    const token = deriveSemanticWidth(width, length, type);
    return TOKEN_TO_COL_SPAN[token];
  }

  // Multi-column sections (2, 3, 4 columns)
  const token = deriveSemanticWidth(width, length, type);
  if (token === "full" || (typeof width === "number" && width >= 1000)) {
    return "col-span-full w-full";
  }

  if (cols === 2) {
    return token === "xl" || token === "xxl" || (typeof width === "number" && width >= 400)
      ? "col-span-2 w-full"
      : "col-span-1 w-full";
  }

  if (cols === 3) {
    if (token === "xl" || token === "xxl" || (typeof width === "number" && width >= 600)) {
      return "col-span-3 w-full";
    }
    if (token === "lg" || (typeof width === "number" && width >= 350)) {
      return "col-span-2 w-full";
    }
    return "col-span-1 w-full";
  }

  if (cols === 4) {
    if (token === "xxl" || (typeof width === "number" && width >= 800)) {
      return "col-span-4 w-full";
    }
    if (token === "xl" || (typeof width === "number" && width >= 550)) {
      return "col-span-3 w-full";
    }
    if (token === "lg" || (typeof width === "number" && width >= 350)) {
      return "col-span-2 w-full";
    }
    return "col-span-1 w-full";
  }

  return "col-span-1 w-full";
}
