import type { CbsRecordFunction, CbsScreenMode, CbsUserSecurityContext } from "@/types";

/* -------------------------------------------------------------------------- */
/* 1. Protocol Types & Enums                                                  */
/* -------------------------------------------------------------------------- */

export type CommandType = "FORM" | "INQUIRY" | "SETTINGS";

export type LaunchTarget = "workspace" | "popup";

export const CBS_SETTINGS_TABS = ["profile", "appearance", "security"] as const;
export type CbsSettingsTabId = (typeof CBS_SETTINGS_TABS)[number];

export const CBS_SETTINGS_EVENT = "cbs:open-settings" as const;

/* -------------------------------------------------------------------------- */
/* 2. Abstract Syntax Tree (AST)                                              */
/* -------------------------------------------------------------------------- */

export interface ParsedCommand {
  // Input & Status
  readonly raw: string;
  readonly isValid: boolean;
  readonly error?: string;

  // Protocol Classification & Title
  readonly type: CommandType;
  readonly application: string;
  readonly title: string;

  // Action, Routing & Authorization
  readonly authLevel: number;
  readonly functionCode?: CbsRecordFunction;
  readonly screenMode: CbsScreenMode;
  readonly target?: string;
  readonly version?: string;

  // Context & Parameters
  readonly recordId?: string;
  readonly params: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/* 3. Execution Options & Payloads                                            */
/* -------------------------------------------------------------------------- */

export interface CommandInquiryState {
  readonly criteria?: Record<string, { value: string; operand: string }>;
  readonly currentPage?: number;
  readonly pageSize?: number;
  readonly step?: "SELECTION" | "RESULTS";
}

export interface ExecutionOptions {
  // Security Context
  readonly user?: CbsUserSecurityContext | null;

  // Dispatch & Presentation Targets
  readonly target?: LaunchTarget;
  readonly tabId?: string;
  readonly title?: string;
  readonly screenMode?: CbsScreenMode;
  readonly recordId?: string;
  readonly searchRecordId?: string;

  // Initial State Payloads (Forms & Inquiries)
  readonly formData?: Record<string, unknown>;
  readonly inquiryState?: CommandInquiryState;

  // Direct Shortcuts for Inquiry Parameters
  readonly criteria?: Record<string, { value: string; operand: string }>;
  readonly currentPage?: number;
  readonly pageSize?: number;
  readonly step?: "SELECTION" | "RESULTS";

  // Execution Behavior & Notifications
  readonly silent?: boolean;
  readonly onError?: (error: string) => void;
}

/* -------------------------------------------------------------------------- */
/* 4. Validation & Protocol Handler Contracts                                 */
/* -------------------------------------------------------------------------- */

export interface CommandValidationResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly requiredRight?: CbsRecordFunction;
}

export interface CommandHandler {
  readonly type: CommandType;
  canHandle(rawInput: string, trimmedUpper: string): boolean;
  parse(rawInput: string, trimmedUpper: string): ParsedCommand;
  execute?(command: ParsedCommand, options?: ExecutionOptions): boolean;
}
