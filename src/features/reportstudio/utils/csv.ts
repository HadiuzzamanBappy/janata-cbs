/**
 * Minimal CSV parser used by the inline dataset manager.
 *
 * Format expectations (preserved verbatim from the monolith):
 *   - First non-blank line is the header row.
 *   - Fields are comma-separated; surrounding double-quotes are stripped.
 *   - Numeric fields are auto-coerced via `Number()` — anything `Number()`
 *     can't parse stays as a string.
 *
 * This is deliberately not a full RFC 4180 parser — embedded commas inside
 * quoted fields, escaped quotes, and multi-line records are NOT handled.
 * If you need them, swap in PapaParse rather than extending this function.
 */
export function csvToRows(csv: string): Record<string, any>[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV needs at least a header row and one data row");
  }
  const headers = lines[0]
    .split(",")
    .map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      const raw = vals[i];
      obj[h] = isNaN(Number(raw)) ? raw : Number(raw);
    });
    return obj;
  });
}
