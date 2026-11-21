import {
  type INQCmd,
  INQUIRY_ID_TOKENS,
  type InquiryRow,
  isInquiryCommand,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";

/** `SCREEN FUNCTION` lead the template and are never row fields. */
const COMMAND_HEAD_TOKENS = 2;

const RECORD_FUNCTIONS: ReadonlySet<string> = new Set(Object.values(CbsRecordFunction));

/** A row action, resolved for one row. `command` is "" when the action can't run for that row. */
export interface InquiryRowAction {
  readonly label: string;
  readonly command: string;
  /** The command's function code (its second token), which decides the right it needs. */
  readonly func: CbsRecordFunction | null;
}

/** The function code of a command or template (`ACCOUNT A @ID` → `A`), or null. */
function commandFunctionOf(command: string): CbsRecordFunction | null {
  const code = command.trim().split(/\s+/)[1]?.toUpperCase() ?? "";
  return RECORD_FUNCTIONS.has(code) ? (code as CbsRecordFunction) : null;
}

/** A row value usable as one command token: text or a finite number, without whitespace. */
function tokenValue(value: unknown): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : "";
  return /\s/.test(text) ? "" : text;
}

function resolveToken(token: string, row: InquiryRow): string {
  if (Object.hasOwn(row, token)) return tokenValue(row[token]);
  const upper = token.toUpperCase();
  if (INQUIRY_ID_TOKENS.includes(upper)) return tokenValue(row.recordId);
  const key = Object.keys(row).find((k) => k.toUpperCase() === upper);
  return key ? tokenValue(row[key]) : "";
}

/**
 * Fills a row's values into an `INQCmd.cmdFor` template (`ACCOUNT S @ID` + row → `ACCOUNT S 1001`).
 * Only the tokens after `SCREEN FUNCTION` are row fields, so a column named like the screen can't
 * rewrite the command. Fails closed: a template that isn't `SCREEN FUNCTION [field...]`, or a field
 * the row has no single-token value for (missing, blank, a list, a value with spaces), gives "".
 */
export function resolveCommandTemplate(template: string, row: InquiryRow): string {
  const clean = template.trim();
  if (!isInquiryCommand(clean)) return "";
  const resolved: string[] = [];
  for (const [idx, token] of clean.split(/\s+/).entries()) {
    const value = idx < COMMAND_HEAD_TOKENS ? token : resolveToken(token, row);
    if (!value) return "";
    resolved.push(value);
  }
  return resolved.join(" ");
}

/**
 * The dynamic row command (`cmdFromInternal` + `cmdFieldName`): a complete command the core put on
 * the row, run as it is. Anything that isn't a text `SCREEN FUNCTION [...]` command (e.g. the core's
 * `eventAction` list) gives "".
 */
export function rowCommandOf(
  row: InquiryRow,
  cmdFromInternal: boolean,
  cmdFieldName: string,
): string {
  const raw = cmdFromInternal && cmdFieldName ? row[cmdFieldName] : undefined;
  return typeof raw === "string" && isInquiryCommand(raw) ? raw.trim().replace(/\s+/g, " ") : "";
}

/**
 * The actions a row offers. With buttons configured, one per button: its own `cmdFor`, or the
 * row's command for a button without one. Without buttons, a single "Open" for the row's command.
 */
export function resolveRowActions(
  commands: readonly INQCmd[],
  row: InquiryRow,
  cmdFromInternal: boolean,
  cmdFieldName: string,
): InquiryRowAction[] {
  const rowCommand = rowCommandOf(row, cmdFromInternal, cmdFieldName);
  if (commands.length === 0) {
    return rowCommand
      ? [{ label: "Open", command: rowCommand, func: commandFunctionOf(rowCommand) }]
      : [];
  }
  return commands.map((cmd) => {
    const template = cmd.cmdFor.trim();
    const command = template ? resolveCommandTemplate(template, row) : rowCommand;
    return { label: cmd.cmdButton, command, func: commandFunctionOf(template || rowCommand) };
  });
}

/**
 * What a double-click (or a passable cell) runs: the row's own command when it has one, else the
 * first See (`S`) button, else the first button. "" when that can't run for the row.
 */
export function primaryRowCommand(
  commands: readonly INQCmd[],
  row: InquiryRow,
  cmdFromInternal: boolean,
  cmdFieldName: string,
): string {
  const rowCommand = rowCommandOf(row, cmdFromInternal, cmdFieldName);
  if (rowCommand) return rowCommand;
  const primary =
    commands.find((c) => commandFunctionOf(c.cmdFor) === CbsRecordFunction.SEE) ?? commands[0];
  return primary ? resolveCommandTemplate(primary.cmdFor, row) : "";
}
