import { cbsCommand } from "@/lib/cbs-command";
import type { EnquiryRow, INQCmd } from "@/lib/data-schemas/inquiry-config-schema";

/**
 * Resolves CBS command templates from INQCmds (e.g. "USER.MGT,NEW1 A recordId" or "ACCOUNT S @ID")
 * by dynamically interpolating row values before execution.
 */
export function resolveCommandTemplate(cmdTemplate: string, row: EnquiryRow): string {
  if (!cmdTemplate) return "";

  const tokens = cmdTemplate.trim().split(/\s+/);
  const resolvedTokens = tokens.map((token) => {
    // 1. Direct key match (case-sensitive)
    if (token in row && row[token] !== undefined && row[token] !== null) {
      return String(row[token]);
    }

    // 2. Standard CBS primary key alias tokens (@ID, @id, RECORDID, ID)
    const upperToken = token.toUpperCase();
    if (upperToken === "@ID" || upperToken === "RECORDID" || upperToken === "ID") {
      const primaryKey = row.recordId ?? row.id ?? row.ID;
      if (primaryKey !== undefined && primaryKey !== null) {
        return String(primaryKey);
      }
    }

    // 3. Case-insensitive field search fallback
    const matchedKey = Object.keys(row).find((k) => k.toUpperCase() === upperToken);
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      return String(row[matchedKey]);
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
