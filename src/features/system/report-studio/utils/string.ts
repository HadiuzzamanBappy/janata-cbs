/**
 * String helpers shared across the canvas and the PDF engine.
 */

/**
 * Replace Unicode characters that jsPDF's default Helvetica subset can't
 * render with ASCII equivalents.
 *
 * Why this matters (preserved from the monolith): jsPDF computes string
 * widths from its font metrics, and unsupported glyphs collapse to zero
 * width — that desynchronises wrapping, alignment, and overflow detection.
 * Substituting at measurement time keeps geometry consistent with rendering.
 *
 * The substitutions cover the currency symbols, dashes, smart quotes, and
 * ellipsis the studio's templates produce; extend the chain rather than
 * reformatting because the order matters for the smart-quote pairs.
 */
export function sanitizeForPdf(s: string): string {
  if (!s) return s;
  return s
    .replace(/৳/g, "Tk ") // Bangladeshi taka
    .replace(/₹/g, "Rs ") // Indian rupee
    .replace(/—/g, "-") // em dash
    .replace(/–/g, "-") // en dash
    .replace(/'/g, "'") // smart single quotes
    .replace(/'/g, "'")
    .replace(/"/g, '"') // smart double quotes
    .replace(/"/g, '"')
    .replace(/…/g, "..."); // ellipsis
}

/**
 * Derive a stable, kebab-case `dataKey` from a human-readable column header.
 *
 *   "First Name"   → "first-name"
 *   "Total Amount" → "total-amount"
 *   "Salary (৳)"   → "salary"
 *
 * Don't change the rule set without auditing the table feature — the same
 * function is called both when columns are created and when the PDF column
 * resolver does name-matching against datasource fields.
 */
export function headerToDataKey(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // strip non-alphanumerics (besides spaces)
    .trim()
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
