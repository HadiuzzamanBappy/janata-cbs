/**
 * Core Type Definitions for CBS Command Gateway Contracts
 */

export type CommandType = "FORM" | "INQUIRY" | "SETTINGS" | "ACTION";

export type ScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";

/**
 * Canonical CBS RIDASH Function Codes
 * Defined once as the single runtime and type-level source of truth.
 */
export const CBS_FUNCTION_CODES = ["R", "I", "D", "A", "S", "H"] as const;

export type FunctionRightCode = (typeof CBS_FUNCTION_CODES)[number];

export interface FunctionMetadata {
  code: FunctionRightCode;
  label: string;
  mode: ScreenMode;
}

export const CBS_FUNCTION_METADATA: Record<FunctionRightCode, FunctionMetadata> = {
  R: { code: "R", label: "Read / Reverse ('R')", mode: "VIEW" },
  I: { code: "I", label: "Input / Create ('I')", mode: "CREATE" },
  D: { code: "D", label: "Delete ('D')", mode: "EDIT" },
  A: { code: "A", label: "Authorise / Amend ('A')", mode: "EDIT" },
  S: { code: "S", label: "See / View ('S')", mode: "VIEW" },
  H: { code: "H", label: "History ('H')", mode: "EDIT" },
};

/** Pre-computed fast Set for O(1) syntax validation */
export const VALID_FUNCTION_CODES_SET = new Set<string>(CBS_FUNCTION_CODES);

export type CommandActionType = "SCREEN" | "SETTINGS" | "THEME" | "LOGOUT";

export interface ParsedCommand {
  /** The original raw command input */
  raw: string;
  /** High-level category of command */
  type: CommandType;
  /** Application or query identifier (e.g., "USER", "ACCOUNT", "USER.LIST") */
  application: string;
  /** Human-readable title for tab header or popup */
  title: string;
  /** Version identifier if specified via comma syntax (e.g. "1001" in "USER,1001") */
  version?: string;
  /** True if command used trailing comma (e.g. "USER,") indicating Zero-Auth Comma Version */
  isCommaVersion?: boolean;
  /** Target authorization level (0 for auto-auth comma versions, 1 for standard operations) */
  authLevel: number;
  /** Explicit single-letter function code (R, I, D, A, S, H) */
  functionCode?: FunctionRightCode;
  /** Database record ID if targeted (e.g. "1001" in "USER 1001") */
  recordId?: string;
  /** Resulting screen mode for rendering */
  screenMode: ScreenMode;
  /** Whether the command parsed without grammatical errors */
  isValid: boolean;
  /** Error explanation if syntax is invalid */
  error?: string;
  /** Target tab ID if type === "SETTINGS" (e.g. "profile", "appearance", "security") */
  settingsTabId?: string;
  /** Target action ID if type === "ACTION" (e.g. "logout", "toggle_theme") */
  actionId?: string;
}
