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

    // Whitespace tokenization
    const rawTokens = trimmed.split(/\s+/);
    const firstToken = rawTokens[0].toUpperCase();
    const remainingTokens = rawTokens.slice(1);

    // 1. Resolve Application, Version, and Comma Auto-Auth Mode (Level 0)
    let app = firstToken;
    let version: string | undefined;
    let authLevel = 1;

    if (firstToken.endsWith(",")) {
      // Trailing comma indicates Level 0 (zero-auth)
      authLevel = 0;
      const withoutComma = firstToken.slice(0, -1);
      if (withoutComma.includes(",")) {
        const parts = withoutComma.split(",");
        app = parts[0];
        version = parts.slice(1).join(",");
      } else {
        app = withoutComma;
        version = "";
      }
    } else if (firstToken.includes(",")) {
      // Comma without trailing comma indicates Version under standard Level 1 (e.g. "USERS,VIP", "USERS,I")
      const parts = firstToken.split(",");
      app = parts[0];
      version = parts.slice(1).join(",");
    }

    if (!app || app.startsWith(",") || firstToken.includes(",,")) {
      return {
        raw: trimmed,
        isValid: false,
        error: `Invalid application or command syntax: "${firstToken}"`,
        type: "FORM",
        application: "",
        title: "",
        authLevel: 1,
        screenMode: "IDLE",
      };
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
        recordId = remainingTokens.slice(1).join(" ").trim() || undefined;
      } else if (token1.length === 1 && /^[A-Z]$/.test(token1)) {
        // Single letter argument that is NOT a valid CBS function code (e.g. 'X', 'Z')
        return {
          raw: trimmed,
          isValid: false,
          error: `Unrecognized function code "${token1}". Valid CBS function codes are: ${CBS_FUNCTION_CODES.join(", ")}.`,
          type: "FORM",
          application: resolvedApp,
          title: appTitle,
          authLevel,
          screenMode: "IDLE",
        };
      } else {
        // Standard command without function code: arguments represent the record ID
        recordId = remainingTokens.join(" ").trim();
      }
    }

    // Screen mode resolution:
    // 1. With recordId: use explicit function code, or default to "S" (standard view)
    // 2. Without recordId (bare model, zero-auth comma, or function code only): strictly loads model in IDLE state (record lookup / search prompt)
    const screenMode: CbsRecordFunction | "IDLE" = recordId ? functionCode || "S" : "IDLE";
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
