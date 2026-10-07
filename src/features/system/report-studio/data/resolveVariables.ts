import type { ReportVariable } from "../types/text-block";
import { TOKEN_REGEX } from "./tokens";

/**
 * Replace every `{{var}}` / `{[var]}` token in `text` with its resolved value.
 *
 * Resolution priority per variable:
 *   1. `v.dataSourceRef` → row chosen from componentDataSources/centralData,
 *      with optional `rowOverrideMap` injection for repeat-mode renders.
 *   2. Fallback: the owning component's first row (`compFirstRow`).
 *   3. `v.staticValue` if defined.
 *   4. Leave the token literal in place so the user can see what didn't bind.
 *
 * This is the PDF-text & canvas-preview cousin of `resolveVariablesToRuns`.
 * Use this one when you need the resolved string for a single-style block;
 * use the runs variant when you need per-variable styling to bleed through.
 */
export function resolveVariables(
  text: string,
  variables: ReportVariable[] | undefined,
  compFirstRow: Record<string, any> | null | undefined,
  componentDataSources?: Record<string, any[]>,
  centralData?: Record<string, any[]>,
  rowOverrideMap?: Record<string, Record<string, any>>,
): string {
  if (!variables || variables.length === 0) return text;

  // Use a local copy of the regex source so we don't trip over `.lastIndex`
  // state being shared with concurrent `resolveVariablesToRuns` calls.
  const re = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);

  return text.replace(re, (match, n1, n2) => {
    const varName = n1 || n2;
    const v = variables.find((rv) => rv.name === varName);
    if (!v) return match;

    let row: Record<string, any> | null | undefined = compFirstRow;
    if (v.dataSourceRef) {
      if (v.dataSourceRef.startsWith("comp:")) {
        row =
          rowOverrideMap?.[v.dataSourceRef] ??
          componentDataSources?.[v.dataSourceRef.slice(5)]?.[0] ??
          null;
      } else if (v.dataSourceRef.startsWith("central:")) {
        row =
          rowOverrideMap?.[v.dataSourceRef] ?? centralData?.[v.dataSourceRef.slice(8)]?.[0] ?? null;
      }
    }

    if (row && v.columnKey && row[v.columnKey] !== undefined && row[v.columnKey] !== null) {
      return String(row[v.columnKey]);
    }
    if (v.staticValue) return v.staticValue;
    return match;
  });
}
