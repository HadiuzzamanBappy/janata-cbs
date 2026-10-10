/**
 * Core Type Definitions & Contracts for CBS Command Gateway
 *
 * Organized in 4 logical chapters:
 * 1. Command Modes & Categories
 * 2. Authentic CBS RIDASH Function Rights
 * 3. Quick System Actions & Settings Modal Tabs
 * 4. Master ParsedCommand Contract (The AST)
 */

// ============================================================================
// Chapter 1: Core Command Modes & Categories
// ============================================================================

import type { CbsScreenMode } from "@/types";

/** High-level routing classification for any executed command */
export type CommandType = "FORM" | "INQUIRY" | "SETTINGS" | "ACTION";

/** Resulting UI screen display mode (Canonical CBS RIDASH codes: "IDLE" | "S" | "I" | "D" | "A" | "R" | "H") */
export type ScreenMode = CbsScreenMode;

// ============================================================================
// Chapter 2: Authentic CBS RIDASH Function Rights
// ============================================================================

import { CBS_FUNCTION_CODES, CBS_FUNCTION_DEFINITIONS, type FunctionRightCode } from "@/types";

export { CBS_FUNCTION_CODES, CBS_FUNCTION_DEFINITIONS, type FunctionRightCode };

export interface FunctionMetadata {
  code: FunctionRightCode;
  label: string;
  mode: ScreenMode;
  description: string;
}

/** Human-readable labels and UI screen modes for each CBS function right */
export const CBS_FUNCTION_METADATA: Record<FunctionRightCode, FunctionMetadata> = {
  S: {
    code: "S",
    label: CBS_FUNCTION_DEFINITIONS.S.label,
    description: CBS_FUNCTION_DEFINITIONS.S.description,
    mode: "S",
  },
  I: {
    code: "I",
    label: CBS_FUNCTION_DEFINITIONS.I.label,
    description: CBS_FUNCTION_DEFINITIONS.I.description,
    mode: "I",
  },
  D: {
    code: "D",
    label: CBS_FUNCTION_DEFINITIONS.D.label,
    description: CBS_FUNCTION_DEFINITIONS.D.description,
    mode: "D",
  },
  A: {
    code: "A",
    label: CBS_FUNCTION_DEFINITIONS.A.label,
    description: CBS_FUNCTION_DEFINITIONS.A.description,
    mode: "A",
  },
  R: {
    code: "R",
    label: CBS_FUNCTION_DEFINITIONS.R.label,
    description: CBS_FUNCTION_DEFINITIONS.R.description,
    mode: "R",
  },
  H: {
    code: "H",
    label: CBS_FUNCTION_DEFINITIONS.H.label,
    description: CBS_FUNCTION_DEFINITIONS.H.description,
    mode: "H",
  },
};

/** Pre-computed Set for high-performance O(1) syntax validation */
export const VALID_FUNCTION_CODES_SET = new Set<string>(CBS_FUNCTION_CODES);

// ============================================================================
// Chapter 3: Quick System Actions & Settings Modal Tabs
// ============================================================================

/** Command action type for static definitions */
export type CommandActionType = "SCREEN" | "SETTINGS" | "THEME" | "LOGOUT";

/** Canonical quick system action identifiers */
export const CBS_SYSTEM_ACTIONS = ["toggle_theme", "logout"] as const;
export type CbsSystemActionId = (typeof CBS_SYSTEM_ACTIONS)[number];

/** Canonical settings modal tab identifiers */
export const CBS_SETTINGS_TABS = ["profile", "appearance", "security"] as const;
export type CbsSettingsTabId = (typeof CBS_SETTINGS_TABS)[number];

// ============================================================================
// Chapter 4: Master ParsedCommand Contract (The AST)
// ============================================================================

/**
 * Strongly typed Abstract Syntax Tree (AST) produced by the CBS grammar parser.
 * Encapsulates the complete execution context for tabs, popups, and dialogs.
 */
export interface ParsedCommand {
  // --- Raw Input ---
  /** Original raw command string typed by the user */
  raw: string;

  // --- Classification & Routing ---
  /** High-level category: FORM, INQUIRY, SETTINGS, or ACTION */
  type: CommandType;
  /** Application or query identifier (e.g. "USER", "ACCOUNT", "USER.LIST") */
  application: string;
  /** Human-readable title for tab header or popup window */
  title: string;

  // --- CBS Formula Modifiers ---
  /** Version identifier if specified via comma syntax (e.g. "1001" in "USER,1001") */
  version?: string;
  /** True if command used trailing comma (e.g. "USER,") indicating Zero-Auth Comma Version */
  isCommaVersion?: boolean;
  /** Authorization level (0 for auto-auth comma versions, 1 for standard operations) */
  authLevel: number;
  /** Explicit single-letter function code (R, I, D, A, S, H) */
  functionCode?: FunctionRightCode;
  /** Database record ID if targeted (e.g. "1001" in "USER 1001") */
  recordId?: string;
  /** Resulting screen mode for rendering (IDLE, CREATE, EDIT, VIEW) */
  screenMode: ScreenMode;

  // --- Validation State ---
  /** Whether the command parsed without grammatical errors */
  isValid: boolean;
  /** Error explanation if syntax is invalid */
  error?: string;

  // --- Modal & Action Targets ---
  /** Target tab ID if type === "SETTINGS" ("profile", "appearance", "security") */
  settingsTabId?: CbsSettingsTabId;
  /** Target action ID if type === "ACTION" ("toggle_theme", "logout") */
  actionId?: CbsSystemActionId;
}
