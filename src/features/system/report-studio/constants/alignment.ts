import type { Align } from "../types/primitives";

/**
 * Alignment lookup tables.
 *
 * The studio mixes two alignment vocabularies — uppercase `Align`
 * (`"LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED"`) used internally, and the
 * lowercase CSS / Chart.js / Quill strings (`"left" | "center" | ...`).
 * These maps bridge them in both directions.
 */

/** `Align` → CSS `text-align` value. */
export const TEXT_ALIGN_MAP: Record<Align, string> = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
  JUSTIFIED: "justify",
};

/** Lowercase → uppercase `Align`. Mirror of `TEXT_ALIGN_MAP`. */
export const ALIGN_MAP: Record<string, Align> = {
  left: "LEFT",
  center: "CENTER",
  right: "RIGHT",
  justify: "JUSTIFIED",
};

/** Constant exported for the PDF text engine — kept as a named export so the
 *  PDF `justifyLine` helper can `import { JUSTIFY } from "@constants/alignment"`. */
export const JUSTIFY = "JUSTIFIED" as const;
