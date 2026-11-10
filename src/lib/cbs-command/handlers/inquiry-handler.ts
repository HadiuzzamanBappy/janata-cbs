import { CBS_FUNCTION_CODES, type CbsRecordFunction } from "@/types";
import type { CommandHandler, ParsedCommand } from "../types";

export class InquiryCommandHandler implements CommandHandler {
  readonly type = "INQUIRY" as const;

  canHandle(_raw: string, upper: string): boolean {
    return upper.startsWith("INQ ") || upper.startsWith("INQUIRY ");
  }

  parse(raw: string, upper: string): ParsedCommand {
    const trimmed = raw.trim();
    const rest = upper.replace(/^(INQUIRY|INQ)\s+/, "").trim();

    if (!rest || rest === "INQ" || rest === "INQUIRY") {
      return {
        raw,
        isValid: false,
        error: "Missing inquiry query identifier. Expected format: INQ <QUERY_NAME>",
        type: "INQUIRY",
        application: "INQUIRY",
        title: "Inquiry Query",
        authLevel: 1,
        screenMode: "S",
      };
    }

    const tokens = rest.split(/\s+/);
    const firstToken = tokens[0];
    const isExplicitFunc = CBS_FUNCTION_CODES.includes(firstToken as CbsRecordFunction);
    const functionCode: CbsRecordFunction = isExplicitFunc
      ? (firstToken as CbsRecordFunction)
      : "S";
    const query = isExplicitFunc ? tokens.slice(1).join(" ") : rest;

    return {
      raw: trimmed,
      isValid: true,
      type: "INQUIRY",
      application: query,
      title: `Inquiry: ${query}`,
      authLevel: 1,
      functionCode,
      screenMode: "S",
    };
  }
}
