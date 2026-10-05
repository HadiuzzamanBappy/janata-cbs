/**
 * CBS Command Grammar Parser
 *
 * Implements standard Core Banking command grammar:
 * - <APP>                         -> Mode: IDLE (e.g., "ACCOUNT")
 * - <APP>,<ID> or <APP> <ID>      -> Mode: EDIT, recordId (e.g., "ACCOUNT,1001", "ACCOUNT 1001")
 * - <APP> <FUNCTION> <ID>         -> Function: I/S/A/D/R/H, Mode: CREATE/VIEW/EDIT (e.g., "ACCOUNT I F3", "ACCOUNT S 1001")
 * - ENQ <QUERY> / INQ <QUERY>     -> Type: ENQUIRY (e.g., "ENQ USER.LIST")
 * - SETTINGS:<TAB> / SETTING><TAB>-> Type: SETTINGS (e.g., "SETTINGS:PROFILE")
 * - ACTION:<ACT>                  -> Type: ACTION (e.g., "ACTION:TOGGLE_THEME", "ACTION:LOGOUT")
 */

export type CommandType = "FORM" | "INQUIRY" | "SETTINGS" | "ACTION";
export type FunctionRightCode = "R" | "I" | "D" | "A" | "S" | "H";
export type ScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";

export interface ParsedCommand {
  raw: string;
  type: CommandType;
  application: string;
  title: string;
  functionCode?: FunctionRightCode;
  recordId?: string;
  screenMode: ScreenMode;
  isValid: boolean;
  error?: string;
  settingsTabId?: string;
  actionId?: string;
}

const VALID_FUNCTION_CODES: Set<FunctionRightCode> = new Set(["R", "I", "D", "A", "S", "H"]);

const FUNCTION_MODE_MAP: Record<FunctionRightCode, ScreenMode> = {
  I: "CREATE",
  S: "VIEW",
  R: "VIEW",
  A: "EDIT",
  D: "EDIT",
  H: "EDIT",
};

/**
 * Parses raw command line string into a structured ParsedCommand contract.
 */
export function parseCbsCommand(rawInput: string): ParsedCommand {
  const trimmed = (rawInput || "").trim();

  if (!trimmed) {
    return {
      raw: "",
      type: "FORM",
      application: "",
      title: "",
      screenMode: "IDLE",
      isValid: false,
      error: "Command input cannot be empty",
    };
  }

  // 1. Settings Command: SETTINGS:<TAB>, SETTING><TAB>, or direct alias PROFILE/SECURITY/THEME
  const upperTrimmed = trimmed.toUpperCase();
  if (upperTrimmed === "PROFILE" || upperTrimmed === "SECURITY" || upperTrimmed === "THEME") {
    const tab = upperTrimmed === "THEME" ? "appearance" : upperTrimmed.toLowerCase();
    return {
      raw: trimmed,
      type: "SETTINGS",
      application: "SETTINGS",
      title: `${upperTrimmed} Settings`,
      settingsTabId: tab,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  const settingsMatch = trimmed.match(/^(?:settings:|setting>)(.+)$/i);
  if (settingsMatch) {
    const tab = settingsMatch[1].trim().toLowerCase();
    return {
      raw: trimmed,
      type: "SETTINGS",
      application: "SETTINGS",
      title: `${tab.toUpperCase()} Settings`,
      settingsTabId: tab,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // 2. Action Command: ACTION:<ACT> or direct alias DARK/LOGOUT/EXIT
  if (upperTrimmed === "DARK") {
    return {
      raw: trimmed,
      type: "ACTION",
      application: "ACTION",
      title: "Action: toggle_theme",
      actionId: "toggle_theme",
      screenMode: "IDLE",
      isValid: true,
    };
  }

  if (upperTrimmed === "LOGOUT" || upperTrimmed === "EXIT") {
    return {
      raw: trimmed,
      type: "ACTION",
      application: "ACTION",
      title: "Action: logout",
      actionId: "logout",
      screenMode: "IDLE",
      isValid: true,
    };
  }

  const actionMatch = trimmed.match(/^action:(.+)$/i);
  if (actionMatch) {
    const act = actionMatch[1].trim().toLowerCase();
    return {
      raw: trimmed,
      type: "ACTION",
      application: "ACTION",
      title: `Action: ${act}`,
      actionId: act,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // 3. Inquiry: INQ <QUERY> or INQUIRY <QUERY>
  const inqMatch = trimmed.match(/^(?:inq|inquiry)\s+(.+)$/i);
  if (inqMatch) {
    const query = inqMatch[1].trim().toUpperCase();
    return {
      raw: trimmed,
      type: "INQUIRY",
      application: query,
      title: `Inquiry: ${query}`,
      screenMode: "VIEW",
      isValid: true,
    };
  }

  // 4. Standard Application Syntax (Form / Workflow)
  // Handles commands like:
  // - "USER.MGT" -> Base app
  // - "USER.MGT,NEW1" -> Versioned app (NEW1 is the version, not record ID)
  // - "USER.MGT,NEW1 I USR001" -> Versioned app with Function I and Record ID USR001
  // - "USER.MGT,USR001" -> Base app with Record ID USR001
  // - "ACCOUNT I 1001" -> Function I and Record ID 1001

  // First, split by space into main tokens
  const spaceTokens = trimmed.split(/\s+/).map((s) => s.trim());
  const firstToken = spaceTokens[0].toUpperCase();

  let app = firstToken;
  let remainingTokens = spaceTokens.slice(1);

  // If first token contains a comma: e.g. "USER.MGT,NEW1" or "ACCOUNT,1001"
  if (firstToken.includes(",")) {
    const commaParts = firstToken.split(",").map((s) => s.trim());
    const baseApp = commaParts[0];
    const afterComma = commaParts.slice(1).join(",");

    // If there are additional space tokens (e.g. "USER.MGT,NEW1 I USR001"):
    // Then "USER.MGT,NEW1" is unequivocally the versioned application command!
    if (spaceTokens.length > 1) {
      app = `${baseApp},${afterComma}`;
    } else {
      // If only "APPLICATION,SECOND" was provided:
      // If the part after comma looks like a version identifier (starts with letters or not purely digits)
      // or if it matches a known version pattern:
      // Treat as versioned app if user explicitly wrote VERSION syntax or if SECOND is not a standard DB record ID
      // Otherwise, "APP,RECORD_ID" opens that record.
      if (/^[A-Z][A-Z0-9._-]*$/i.test(afterComma) && !afterComma.match(/^\d+$/) && afterComma.startsWith("NEW")) {
        app = `${baseApp},${afterComma}`;
      } else {
        // Standard "APP,RECORD_ID"
        app = baseApp;
        remainingTokens = [afterComma, ...remainingTokens];
      }
    }
  }

  // Basic check: application name base must be valid
  const baseCheck = app.split(",")[0];
  if (!/^[A-Z][A-Z0-9._-]*$/i.test(baseCheck)) {
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: app,
      screenMode: "IDLE",
      isValid: false,
      error: `Invalid application name "${app}". Application must be alphanumeric.`,
    };
  }

  // Case A: Just <APP> or <APP,VERSION> (e.g., "USER.MGT", "USER.MGT,NEW1") -> IDLE mode
  if (remainingTokens.length === 0) {
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: app,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // Case B: <APP> <TOKEN2> (e.g., "USER.MGT I", "USER.MGT USR001")
  if (remainingTokens.length === 1) {
    const second = remainingTokens[0].toUpperCase();

    // Check if second token is a function code (R, I, D, A, S, H)
    if (VALID_FUNCTION_CODES.has(second as FunctionRightCode)) {
      const fnCode = second as FunctionRightCode;
      return {
        raw: trimmed,
        type: "FORM",
        application: app,
        title: `${app} (${fnCode})`,
        functionCode: fnCode,
        screenMode: FUNCTION_MODE_MAP[fnCode],
        isValid: true,
      };
    }

    // Otherwise, second token is recordId -> EDIT mode
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: `${app} [${second}]`,
      recordId: second,
      screenMode: "EDIT",
      isValid: true,
    };
  }

  // Case C: <APP> <FUNCTION> <RECORD_ID> (e.g., "USER.MGT,NEW1 I USR001", "ACCOUNT S 1001")
  const second = remainingTokens[0].toUpperCase();
  const third = remainingTokens.slice(1).join(" ").trim();

  if (VALID_FUNCTION_CODES.has(second as FunctionRightCode)) {
    const fnCode = second as FunctionRightCode;
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: `${app} [${third}]`,
      functionCode: fnCode,
      recordId: third,
      screenMode: FUNCTION_MODE_MAP[fnCode],
      isValid: true,
    };
  }

  // Case D: <APP> <PART1> <PART2> without valid function code
  const recordId = remainingTokens.join(" ");
  return {
    raw: trimmed,
    type: "FORM",
    application: app,
    title: `${app} [${recordId}]`,
    recordId,
    screenMode: "EDIT",
    isValid: true,
  };
}
