/**
 * Number formatting helpers — kept identical to the monolith because the PDF
 * renderer and the canvas both call these and any drift would produce visible
 * mismatches between preview and output.
 */

/**
 * Apply a rounding rule (or none).
 *
 * `"none"` (or undefined rule) leaves the value untouched — important for the
 * conditional-formatting path which sometimes wants the raw value for
 * predicate evaluation even after the column applies a format.
 */
export function applyRounding(
  v: number,
  rule?: "none" | "floor" | "ceil" | "round",
): number {
  if (!rule || rule === "none") return v;
  if (rule === "floor") return Math.floor(v);
  if (rule === "ceil") return Math.ceil(v);
  return Math.round(v);
}

/**
 * Format a numeric column cell. Honours `format`, `decimals`, and `rounding`
 * in that order:
 *   1. round per `rounding`,
 *   2. apply `format` (currency adds the ৳ symbol, plain just localises),
 *   3. honour `decimals` if specified (currency defaults to 0).
 *
 * Locale is fixed to `en-IN` — this is intentional, the monolith targets
 * Bangladeshi reporting (lakhs / crores grouping).
 */
export function formatColNumber(
  v: number,
  col: {
    format?: string | null;
    decimals?: number;
    rounding?: "none" | "floor" | "ceil" | "round";
  },
): string {
  const rounded = applyRounding(v, col.rounding);
  const dec = col.decimals ?? (col.format === "currency" ? 0 : undefined);

  if (col.format === "currency") {
    if (dec !== undefined && dec > 0) {
      return (
        "৳" +
        rounded.toLocaleString("en-IN", {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        })
      );
    }
    return "৳" + rounded.toLocaleString("en-IN");
  }

  if (dec !== undefined) {
    return rounded.toLocaleString("en-IN", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  }
  return String(rounded);
}

/** Convenience: format a value as Bangladeshi currency with the ৳ prefix. */
export const formatCurrency = (v: number) => "৳" + v.toLocaleString("en-IN");
