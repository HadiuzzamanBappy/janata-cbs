import { cbsCommand } from "@/lib/cbs-command";
import type { EnquiryRow, INQCmd } from "@/lib/data-schemas/inquiry-config-schema";

/**
 * Resolves CBS command templates from INQCmds (e.g. "USER.MGT,NEW1 A recordId")
 * by dynamically interpolating row values before execution.
 */
export function resolveCommandTemplate(cmdTemplate: string, row: EnquiryRow): string {
  if (!cmdTemplate) return "";

  const tokens = cmdTemplate.trim().split(/\s+/);
  const resolvedTokens = tokens.map((token) => {
    // Check if token matches a field property in the row
    if (token in row && row[token] !== undefined && row[token] !== null) {
      return String(row[token]);
    }
    return token;
  });

  return resolvedTokens.join(" ");
}

/**
 * Dispatches an inquiry action command against a targeted row.
 */
export function executeInquiryCommand(command: INQCmd, row: EnquiryRow) {
  const executable = resolveCommandTemplate(command.cmdFor, row);
  if (!executable) return;

  cbsCommand.execute(executable);
}

