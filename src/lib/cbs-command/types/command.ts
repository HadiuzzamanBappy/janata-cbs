// ============================================================================
// Core Type Definitions & Contracts for CBS Command Gateway
//
// Organized into 4 chapters:
// 1. Command Modes & Categories
// 2. Authentic CBS RIDASH Function Rights & Metadata
// 3. Quick System Actions & Settings Modal Tabs
// 4. Master ParsedCommand Contract (The AST)
// ============================================================================

// ============================================================================
// Chapter 1: Core Command Modes & Categories
// ============================================================================

import type { CbsScreenMode } from "@/types";

/** High-level routing classification for any executed command */
export type CommandType = "FORM" | "INQUIRY" | "SETTINGS" | "ACTION";

/** Resulting UI screen display mode (Canonical CBS RIDASH codes: "IDLE" | "S" | "I" | "D" | "A" | "R" | "H") */
export type ScreenMode = CbsScreenMode;

// ============================================================================
// Chapter 2: Authentic CBS RIDASH Function Rights & Metadata
// ============================================================================

import { CBS_FUNCTION_CODES, CBS_FUNCTION_DEFINITIONS, type CbsRecordFunction } from "@/types";

export { CBS_FUNCTION_CODES, CBS_FUNCTION_DEFINITIONS, type CbsRecordFunction };

export type FunctionMetadata = (typeof CBS_FUNCTION_DEFINITIONS)[CbsRecordFunction];

/** Human-readable labels and UI screen modes for each CBS function right (canonical alias) */
export const CBS_FUNCTION_METADATA = CBS_FUNCTION_DEFINITIONS;

/** Pre-computed Set for high-performance O(1) syntax validation */
export const VALID_FUNCTION_CODES_SET = new Set<string>(CBS_FUNCTION_CODES);

// ============================================================================
// Chapter 3: Quick System Actions & Settings Modal Tabs
// ============================================================================

/** Command action type for static definitions and catalog entries */
export type CommandActionType = "SCREEN" | "POPUP" | "SETTINGS" | "THEME" | "LOGOUT";

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
  readonly raw: string;

  // --- Classification & Routing ---
  /** High-level category: FORM, INQUIRY, SETTINGS, or ACTION */
  readonly type: CommandType;
  /** Application or query identifier (e.g. "USER", "ACCOUNT", "USER.LIST") */
  readonly application: string;
  /** Human-readable title for tab header or popup window */
  readonly title: string;

  // --- CBS Formula Modifiers ---
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

  // --- Validation State ---
  /** Whether the command parsed without grammatical errors */
  readonly isValid: boolean;
  /** Error explanation if syntax is invalid */
  readonly error?: string;

  // --- Modal & Action Targets ---
  /** Target tab ID if type === "SETTINGS" ("profile", "appearance", "security") */
  readonly settingsTabId?: CbsSettingsTabId;
  /** Target action ID if type === "ACTION" ("toggle_theme", "logout") */
  readonly actionId?: CbsSystemActionId;
}
