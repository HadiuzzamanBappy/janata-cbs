import type { ReportVariable, VarStyle, VariableRun } from "../types/text-block";
import { TOKEN_REGEX } from "./tokens";

/**
 * Split a string into a sequence of runs — plain text or a resolved variable
 * value carrying its own `VarStyle` override.
 *
 * Why this exists separately from `resolveVariables`: the PDF renderer needs
 * to draw a variable value with different formatting (bold, colour,
 * highlight, etc.) than the surrounding paragraph text. A single
 * concatenated string can't carry that information, so we hand the renderer
 * a list of styled runs which it walks in sequence.
 *
 * The `rowOverrideMap` honours repeat-mode renders identically to
 * `resolveVariables` — see CRITICAL DETAIL #8.
 */
export function resolveVariablesToRuns(
  text: string,
  variables: ReportVariable[] | undefined,
  compFirstRow: Record<string, any> | null | undefined,
  componentDataSources?: Record<string, any[]>,
  centralData?: Record<string, any[]>,
  rowOverrideMap?: Record<string, Record<string, any>>,
): VariableRun[] {
  if (!variables || variables.length === 0) return [{ text }];

  const runs: VariableRun[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  // Fresh regex per call — TOKEN_REGEX is global-flagged and we must not
  // share `.lastIndex` between concurrent calls.
  const re = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);
  re.lastIndex = 0;

  while ((m = re.exec(text)) !== null) {
    const before = text.slice(last, m.index);
    if (before) runs.push({ text: before });

    const varName = m[1] || m[2];
    const v = variables.find(rv => rv.name === varName);
    if (!v) {
      runs.push({ text: m[0] });
      last = m.index + m[0].length;
      continue;
    }

    let row: Record<string, any> | null | undefined = compFirstRow;
    if (v.dataSourceRef?.startsWith("comp:")) {
      row =
        rowOverrideMap?.[v.dataSourceRef] ??
        componentDataSources?.[v.dataSourceRef.slice(5)]?.[0] ??
        null;
    } else if (v.dataSourceRef?.startsWith("central:")) {
      row =
        rowOverrideMap?.[v.dataSourceRef] ??
        centralData?.[v.dataSourceRef.slice(8)]?.[0] ??
        null;
    }

    const value =
      row && v.columnKey && row[v.columnKey] != null
        ? String(row[v.columnKey])
        : v.staticValue || m[0];

    runs.push({ text: value, varStyle: v.style as VarStyle | undefined });
    last = m.index + m[0].length;
  }

  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs;
}
