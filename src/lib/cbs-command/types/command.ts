import type { CbsRecordFunction, CbsScreenMode } from "@/types";
import { CBS_FUNCTION_CODES, CBS_FUNCTION_DEFINITIONS } from "@/types";

/* -------------------------------------------------------------------------- */
/* 1. Command Routing & Classification                                        */
/* -------------------------------------------------------------------------- */

/** High-level routing classification for any executed command */
export type CommandType = "FORM" | "INQUIRY" | "SETTINGS";

/** Resulting UI screen display mode (Canonical CBS RIDASH codes: "IDLE" | "S" | "I" | "D" | "A" | "R" | "H") */
export type ScreenMode = CbsScreenMode;

/** Command action type for database controls (SC_CONTROL) and UI routing */
export type CommandActionType = "SCREEN" | "POPUP" | "SETTINGS";

/** Canonical settings modal tab identifiers */
export const CBS_SETTINGS_TABS = ["profile", "appearance", "security"] as const;
export type CbsSettingsTabId = (typeof CBS_SETTINGS_TABS)[number];

/* -------------------------------------------------------------------------- */
/* 2. Authentic CBS RIDASH Function Metadata & Fast Lookup                    */
/* -------------------------------------------------------------------------- */

export { CBS_FUNCTION_CODES, CBS_FUNCTION_DEFINITIONS, type CbsRecordFunction };

export type FunctionMetadata = (typeof CBS_FUNCTION_DEFINITIONS)[CbsRecordFunction];

/** Human-readable labels and UI screen modes for each CBS function right */
export const CBS_FUNCTION_METADATA = CBS_FUNCTION_DEFINITIONS;

/** Pre-computed Set for O(1) syntax and token validation */
export const VALID_FUNCTION_CODES_SET = new Set<string>(CBS_FUNCTION_CODES);

/* -------------------------------------------------------------------------- */
/* 3. Parsed Command Contract (AST)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Strongly typed Abstract Syntax Tree (AST) produced by the CBS grammar parser.
 * Encapsulates the complete execution context for tabs, popups, and dialogs.
 */
export interface ParsedCommand {
  /** Original raw command string typed by the user */
  readonly raw: string;

  /** High-level category: FORM, INQUIRY, or SETTINGS */
  readonly type: CommandType;

  /** Application or query identifier (e.g. "USER", "ACCOUNT", "USER.LIST") */
  readonly application: string;

  /** Human-readable title for tab header or popup window */
  readonly title: string;

  /** Version identifier if specified via comma syntax (e.g. "1001" in "USER,1001") */
  readonly version?: string;

  /** True if command used trailing comma (e.g. "USER,") indicating Zero-Auth Comma Version */
  readonly isCommaVersion?: boolean;

  /** Authorization level (0 for auto-auth comma versions, 1 for standard operations) */
  readonly authLevel: number;

  /** Explicit single-letter function code (R, I, D, A, S, H) */
  readonly functionCode?: CbsRecordFunction;

  /** Database record ID if targeted (e.g. "1001" in "USER 1001") */
  readonly recordId?: string;

  /** Resulting screen mode for rendering (IDLE, S, I, D, A, R, H) */
  readonly screenMode: ScreenMode;

  /** Whether the command parsed without grammatical errors */
  readonly isValid: boolean;

  /** Error explanation if syntax is invalid */
  readonly error?: string;

  /** Target tab ID if type === "SETTINGS" ("profile", "appearance", "security") */
  readonly settingsTabId?: CbsSettingsTabId;
}
