import { CBS_FUNCTION_CODES, type CbsRecordFunction } from "@/types";
import { resolveCommandAlias, resolveCommandTitle } from "../registry/alias";
import type { CommandHandler, ParsedCommand } from "../types";

export class FormCommandHandler implements CommandHandler {
  readonly type = "FORM" as const;

  canHandle(): boolean {
    return true; // Default fallback for all forms and screens
  }

  parse(raw: string, _upper: string): ParsedCommand {
    const trimmed = raw.trim();
    const tokens = trimmed.split(/\s+/);
    const firstToken = tokens[0].toUpperCase();
    const remainingTokens = tokens.slice(1);

    // 1. Resolve Application, Version, and Comma Auto-Auth Mode
    let app = firstToken;
    let version: string | undefined;
    let authLevel = 1;

    if (firstToken.endsWith(",")) {
      app = firstToken.slice(0, -1);
      version = "";
      authLevel = 0;
    } else if (firstToken.includes(",")) {
      const parts = firstToken.split(",");
      app = parts[0];
      version = parts.slice(1).join(",");
    }

    const resolvedApp = resolveCommandAlias(app);
    const baseTitle = resolveCommandTitle(resolvedApp) || resolvedApp;
    const appTitle = version ? `${baseTitle},${version}` : baseTitle;

    // 2. Parse Function Code and Record ID from remaining arguments
    let functionCode: CbsRecordFunction | undefined;
    let recordId: string | undefined;

    if (remainingTokens.length > 0) {
      const token1 = remainingTokens[0].toUpperCase();
      if (CBS_FUNCTION_CODES.includes(token1 as CbsRecordFunction)) {
        functionCode = token1 as CbsRecordFunction;
        recordId = remainingTokens.slice(1).join(" ") || undefined;
      } else if (authLevel === 0) {
        // Comma direct entry defaults to Input mode
        functionCode = "I";
        recordId = remainingTokens.join(" ");
      } else if (remainingTokens.length === 1) {
        recordId = remainingTokens[0];
      } else {
        return {
          raw: trimmed,
          isValid: false,
          error: `Unrecognized argument "${remainingTokens[0]}" for ${resolvedApp}. Expected function (${CBS_FUNCTION_CODES.join(", ")}) or record ID.`,
          type: "FORM",
          application: resolvedApp,
          title: appTitle,
          authLevel,
          screenMode: "IDLE",
        };
      }
    }

    // Default screen mode: matches functionCode if given, "I" if recordId is provided, else "IDLE"
    const screenMode = functionCode || (recordId ? "I" : "IDLE");
    const displayTitle = recordId ? `${appTitle} #${recordId}` : appTitle;

    return {
      raw: trimmed,
      isValid: true,
      type: "FORM",
      application: resolvedApp,
      title: displayTitle,
      target: resolvedApp,
      version,
      authLevel,
      functionCode,
      recordId,
      screenMode,
    };
  }
}
