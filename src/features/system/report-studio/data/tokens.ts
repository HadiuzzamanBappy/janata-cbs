import type { ReportVariable } from "../types/text-block";

/**
 * Variable-token regex and helpers.
 *
 * The studio supports two interchangeable token syntaxes:
 *   {{token_name}}   — double-curly, the syntax we encourage users to type.
 *   {[token_name]}   — legacy curly-bracket form, kept for backward compat
 *                       with reports authored before v6.3.
 *
 * `TOKEN_REGEX` matches both shapes and captures the name in `m[1] || m[2]`.
 * Always reset `.lastIndex` to 0 before `exec()`-looping a fresh string —
 * the regex is `g`-flagged so the engine remembers state between calls.
 */
export const TOKEN_REGEX = /\{\{([^}]+)\}\}|\{\[([^\]]+)\]\}/g;

/** Pull a token name from a regex match — returns whichever capture matched. */
export function tokenName(match: RegExpExecArray | RegExpMatchArray): string {
  return (match[1] || match[2] || "").trim();
}

/**
 * Scan `text` and return the set of distinct token names referenced. Order
 * matches first appearance — useful for the "Auto-map" feature which walks
 * tokens left-to-right and matches them against datasource column names.
 */
export function scanTokens(text: string): string[] {
  const seen: string[] = [];
  const set = new Set<string>();
  TOKEN_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_REGEX.exec(text)) !== null) {
    const name = tokenName(m);
    if (name && !set.has(name)) {
      set.add(name);
      seen.push(name);
    }
  }
  return seen;
}

/**
 * Look up the row a particular variable should resolve against, honouring the
 * `rowOverrideMap` injected by repeat-mode renders.
 *
 *   - "comp:<id>"     → componentDataSources[id][0]
 *   - "central:<key>" → centralData[key][0]
 *   - undefined ref   → falls back to `compFirstRow`
 *
 * Returns `null` when nothing resolves.
 */
export function rowForVariable(
  v: Pick<ReportVariable, "dataSourceRef">,
  compFirstRow: Record<string, any> | null | undefined,
  componentDataSources?: Record<string, any[]>,
  centralData?: Record<string, any[]>,
  rowOverrideMap?: Record<string, Record<string, any>>,
): Record<string, any> | null {
  if (!v.dataSourceRef) return compFirstRow ?? null;
  if (v.dataSourceRef.startsWith("comp:")) {
    return (
      rowOverrideMap?.[v.dataSourceRef] ??
      componentDataSources?.[v.dataSourceRef.slice(5)]?.[0] ??
      null
    );
  }
  if (v.dataSourceRef.startsWith("central:")) {
    return (
      rowOverrideMap?.[v.dataSourceRef] ?? centralData?.[v.dataSourceRef.slice(8)]?.[0] ?? null
    );
  }
  return compFirstRow ?? null;
}
