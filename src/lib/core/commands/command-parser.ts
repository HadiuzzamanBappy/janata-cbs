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

export type CommandType = "FORM" | "ENQUIRY" | "SETTINGS" | "ACTION";
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

  // 3. Enquiry / Inquiry: ENQ <QUERY> or INQ <QUERY>
  const enqMatch = trimmed.match(/^(?:enq|inq)\s+(.+)$/i);
  if (enqMatch) {
    const query = enqMatch[1].trim().toUpperCase();
    return {
      raw: trimmed,
      type: "ENQUIRY",
      application: query,
      title: `Enquiry: ${query}`,
      screenMode: "VIEW",
      isValid: true,
    };
  }

  // 4. Standard Application Syntax (Form / Workflow)
  // Clean comma separation: "ACCOUNT,1001" -> ["ACCOUNT", "1001"]
  const normalized = trimmed.includes(",")
    ? trimmed.split(",").map((s) => s.trim())
    : trimmed.split(/\s+/).map((s) => s.trim());

  const app = normalized[0].toUpperCase();

  // Basic check: application name must start with letter/alphanumeric or dot
  if (!/^[A-Z][A-Z0-9._-]*$/i.test(app)) {
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

  // Case A: Just <APP> (e.g., "ACCOUNT") -> IDLE mode
  if (normalized.length === 1) {
    return {
      raw: trimmed,
      type: "FORM",
      application: app,
      title: app,
      screenMode: "IDLE",
      isValid: true,
    };
  }

  // Case B: <APP> <TOKEN2> (e.g., "ACCOUNT I", "ACCOUNT 1001", "ACCOUNT,1001")
  if (normalized.length === 2) {
    const second = normalized[1].toUpperCase();

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

  // Case C: <APP> <FUNCTION> <RECORD_ID> (e.g., "ACCOUNT I F3", "ACCOUNT S 1001", "ACCOUNT A 1001")
  const second = normalized[1].toUpperCase();
  const third = normalized.slice(2).join(" ").trim();

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
  // Example: "ACCOUNT 1001 EXTRA" -> treated as recordId "1001 EXTRA" in EDIT mode
  const recordId = normalized.slice(1).join(" ");
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
