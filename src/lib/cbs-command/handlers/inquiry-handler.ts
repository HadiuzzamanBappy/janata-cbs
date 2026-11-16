import { CBS_FUNCTION_CODES, CbsRecordFunction } from "@/types";
import { resolveCommandTitle } from "../registry/alias";
import type { CommandHandler, ParsedCommand } from "../types";

export class InquiryCommandHandler implements CommandHandler {
  readonly type = "INQUIRY" as const;

  canHandle(_raw: string, upper: string): boolean {
    return /^(INQUIRY|INQ)(\s+|$)/i.test(upper.trim());
  }

  parse(raw: string, upper: string): ParsedCommand {
    const trimmed = raw.trim();
    const rest = upper.replace(/^(INQUIRY|INQ)\s*/i, "").trim();

    if (!rest) {
      return {
        raw,
        isValid: false,
        error: "Missing inquiry query identifier. Expected format: INQ [FUNCTION] <QUERY_NAME>",
        type: "INQUIRY",
        application: "INQUIRY",
        title: "Inquiry Query",
        authLevel: 1,
        screenMode: CbsRecordFunction.SEE,
      };
    }

    const tokens = rest.split(/\s+/);
    const firstToken = tokens[0].toUpperCase();
    const isExplicitFunc = CBS_FUNCTION_CODES.includes(firstToken as CbsRecordFunction);
    const functionCode: CbsRecordFunction = isExplicitFunc
      ? (firstToken as CbsRecordFunction)
      : "S";
    const query = isExplicitFunc ? tokens.slice(1).join(" ").trim() : rest;

    if (!query) {
      return {
        raw,
        isValid: false,
        error: `Missing inquiry query identifier after function "${functionCode}". Expected format: INQ ${functionCode} <QUERY_NAME>`,
        type: "INQUIRY",
        application: "INQUIRY",
        title: "Inquiry Query",
        authLevel: 1,
        functionCode,
        screenMode: CbsRecordFunction.SEE,
      };
    }

    const title = resolveCommandTitle(query) || `Inquiry: ${query}`;

    return {
      raw: trimmed,
      isValid: true,
      type: "INQUIRY",
      application: query,
      title,
      authLevel: 1,
      functionCode,
      screenMode: functionCode,
    };
  }
}
