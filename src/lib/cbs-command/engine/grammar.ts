/**
 * CBS Command Grammar Parser
 *
 * Implements standard Core Banking command grammar:
 * 1. Base Application:          USER                   -> Mode: IDLE, AuthLevel: 1
 * 2. Comma Version (Auto-Auth): USER,                  -> Mode: CREATE, AuthLevel: 0 (Admin Auto-Auth direct entry)
 * 3. Version of Model:          USER,1001 / USER,ADMIN -> Version: 1001, Mode: CREATE/IDLE, AuthLevel: 1
 * 4. Record Lookup:             USER 1001              -> RecordId: 1001, Mode: EDIT, AuthLevel: 1
 * 5. Explicit Function:         USER I 1001            -> Function: I, Mode: CREATE, AuthLevel: 1
 *                               USER S 1001            -> Function: S, Mode: VIEW, AuthLevel: 1
 *                               USER A 1001            -> Function: A, Mode: EDIT, AuthLevel: 1
 * 6. Inquiry:                   INQ USER.LIST          -> Type: INQUIRY, Mode: VIEW, AuthLevel: 1
 * 7. Settings Modal:            SETTINGS:PROFILE       -> Type: SETTINGS, Tab: profile
 * 8. System Action:             ACTION:LOGOUT          -> Type: ACTION, Action: logout
 */

import type { FunctionRightCode } from "@/types";
import { resolveCommandAlias } from "../registry/alias";
import {
  CBS_FUNCTION_METADATA,
  CBS_SETTINGS_TABS,
  CBS_SYSTEM_ACTIONS,
  type CbsSettingsTabId,
  type CbsSystemActionId,
  type ParsedCommand,
  VALID_FUNCTION_CODES_SET,
} from "../types/command";

/**
 * Parses raw terminal command string into a strongly typed ParsedCommand contract.
 */
export function parseCbsCommand(rawInput: string): ParsedCommand {
  const trimmed = (rawInput || "").trim();

  if (!trimmed) {
    return {
      raw: "",
      type: "FORM",
      application: "",
      title: "",
      authLevel: 1,
      screenMode: "IDLE",
      isValid: false,
      error: "Command input cannot be empty.",
    };
  }

  const upperTrimmed = trimmed.toUpperCase();

  // 1. Settings Command: SETTINGS:<TAB>, SETTING><TAB>, or direct alias PROFILE/SECURITY/THEME
  const rawTab =
    upperTrimmed === "PROFILE" || upperTrimmed === "SECURITY"
      ? upperTrimmed.toLowerCase()
      : upperTrimmed === "THEME"
        ? "appearance"
        : trimmed
            .match(/^(?:settings:|setting>)(.+)$/i)?.[1]
            ?.trim()
            .toLowerCase();

  const settingsTab = CBS_SETTINGS_TABS.includes(rawTab as CbsSettingsTabId)
    ? (rawTab as CbsSettingsTabId)
    : undefined;

  if (settingsTab) {
    return {
      raw: trimmed,
      type: "SETTINGS",
      application: "SETTINGS",
      title: `${settingsTab.toUpperCase()} Settings`,
      authLevel: 1,
      settingsTabId: settingsTab,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // 2. Action Command: ACTION:<ACT> or direct alias DARK/LOGOUT/EXIT
  const rawAction =
    upperTrimmed === "DARK"
      ? "toggle_theme"
      : upperTrimmed === "LOGOUT" || upperTrimmed === "EXIT"
        ? "logout"
        : trimmed
            .match(/^action:(.+)$/i)?.[1]
            ?.trim()
            .toLowerCase();

  const actionId = CBS_SYSTEM_ACTIONS.includes(rawAction as CbsSystemActionId)
    ? (rawAction as CbsSystemActionId)
    : undefined;

  if (actionId) {
    return {
      raw: trimmed,
      type: "ACTION",
      application: "ACTION",
      title: `Action: ${actionId}`,
      authLevel: 1,
      actionId,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // 3. Inquiry: INQ [FUNCTION] <QUERY> or INQUIRY [FUNCTION] <QUERY>
  const inqMatch = trimmed.match(/^(?:inq|inquiry)\s+(.+)$/i);
  if (inqMatch) {
    const rawRest = inqMatch[1].trim();
    const tokens = rawRest.split(/\s+/);
    let fnCode: FunctionRightCode | undefined;
    let query = rawRest.toUpperCase();

    // If first token is a valid single-letter function code (e.g. S, A, I, R, D, H)
    if (tokens.length > 1 && VALID_FUNCTION_CODES_SET.has(tokens[0].toUpperCase())) {
      fnCode = tokens[0].toUpperCase() as FunctionRightCode;
      query = tokens.slice(1).join(" ").trim().toUpperCase();
    }

    return {
      raw: trimmed,
      type: "INQUIRY",
      application: query,
      title: `Inquiry: ${query}`,
      authLevel: 1,
      functionCode: fnCode,
      screenMode: fnCode ? CBS_FUNCTION_METADATA[fnCode].mode : "VIEW",
      isValid: true,
    };
  }

  // 4. Check for Shorthand Application Aliases (e.g. MD -> MENU.DESIGN, MC -> MODEL.CONFIG)
  const canonicalAlias = resolveCommandAlias(trimmed);
  if (canonicalAlias !== upperTrimmed && !canonicalAlias.includes(" ")) {
    return {
      raw: trimmed,
      type: "FORM",
      application: canonicalAlias,
      title: canonicalAlias,
      authLevel: 1,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // 5. Standard CBS Application Syntax: APP[,VERSION] [FUNCTION] [RECORD_ID]
  const spaceTokens = trimmed.split(/\s+/).map((s) => s.trim());
  const firstToken = spaceTokens[0].toUpperCase();
  const remainingTokens = spaceTokens.slice(1);

  let app = firstToken;
  let version: string | undefined;
  let isCommaVersion = false;
  let authLevel = 1;

  // RULE A: Trailing Comma (e.g. "USER,") -> Auto-Auth / Comma Version
  if (firstToken.endsWith(",")) {
    app = firstToken.slice(0, -1);
    isCommaVersion = true;
    authLevel = 0; // CBS Auto-Auth: bypass maker-checker, direct LIVE commit
  }
  // RULE B: Comma with Version Name (e.g. "USER,1001", "USER,ADMIN", "CUSTOMER,KYC")
  else if (firstToken.includes(",")) {
    const commaParts = firstToken.split(",");
    app = commaParts[0];
    version = commaParts.slice(1).join(",");
  }

  // Basic validation: application base must be alphanumeric
  if (!/^[A-Z][A-Z0-9._-]*$/i.test(app)) {
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: app,
      authLevel: 1,
      screenMode: "IDLE",
      isValid: false,
      error: `Invalid application name "${app}". Application code must be alphanumeric.`,
    };
  }

  const appTitle = version ? `${app},${version}` : app;

  // Case 1: Trailing Comma "APP," -> Direct Input / Auto-Auth mode
  if (isCommaVersion) {
    const firstRemaining = remainingTokens[0]?.toUpperCase();
    const isExplicitFunc = firstRemaining && VALID_FUNCTION_CODES_SET.has(firstRemaining);
    const functionCode: FunctionRightCode = isExplicitFunc
      ? (firstRemaining as FunctionRightCode)
      : "I";
    const recordId = isExplicitFunc ? remainingTokens[1] : remainingTokens[0];

    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: appTitle,
      isCommaVersion: true,
      authLevel: 0,
      functionCode,
      recordId: recordId || undefined,
      screenMode: "CREATE",
      isValid: true,
    };
  }

  // Case 2: Just <APP> or <APP,VERSION> -> IDLE mode
  if (remainingTokens.length === 0) {
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: appTitle,
      version,
      authLevel,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // Case 3: <APP> <TOKEN2> (e.g. "USER 1001" or "USER I")
  if (remainingTokens.length === 1) {
    const token = remainingTokens[0];
    const upperToken = token.toUpperCase();

    // If token is a function code (I, S, A, D, R, H)
    if (VALID_FUNCTION_CODES_SET.has(upperToken)) {
      const fnCode = upperToken as FunctionRightCode;
      return {
        raw: trimmed,
        type: "FORM",
        application: app,
        title: appTitle,
        version,
        authLevel,
        functionCode: fnCode,
        screenMode: CBS_FUNCTION_METADATA[fnCode].mode,
        isValid: true,
      };
    }

    // Token is Record ID (e.g. "USER 1001" -> fetch and edit record 1001)
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: `${appTitle} #${token}`,
      version,
      authLevel,
      recordId: token,
      screenMode: "EDIT",
      isValid: true,
    };
  }

  // Case 4: <APP> <FUNCTION> <RECORD_ID...> (e.g. "USER I 1001", "ACCOUNT S 1000001;2")
  const funcToken = remainingTokens[0].toUpperCase();
  if (VALID_FUNCTION_CODES_SET.has(funcToken)) {
    const fnCode = funcToken as FunctionRightCode;
    const recordId = remainingTokens.slice(1).join(" ");
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: `${appTitle} #${recordId}`,
      version,
      authLevel,
      functionCode: fnCode,
      recordId,
      screenMode: CBS_FUNCTION_METADATA[fnCode].mode,
      isValid: true,
    };
  }

  // Invalid parameters
  return {
    raw: trimmed,
    type: "FORM",
    application: app,
    title: appTitle,
    authLevel,
    screenMode: "IDLE",
    isValid: false,
    error: `Unrecognized function or argument "${remainingTokens[0]}" for application ${app}. Expected function code (I, S, A, D, R, H) or record ID.`,
  };
}
