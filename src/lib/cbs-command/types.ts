import type { CbsRecordFunction, CbsScreenMode, CbsUserSecurityContext } from "@/types";

// 1. Protocol Types & Enums
export type CommandType = "FORM" | "INQUIRY" | "SETTINGS";
export type LaunchTarget = "workspace" | "popup";
export const CBS_SETTINGS_TABS = ["profile", "appearance", "security"] as const;
export type CbsSettingsTabId = (typeof CBS_SETTINGS_TABS)[number];
export const CBS_SETTINGS_EVENT = "cbs:open-settings" as const;

export const CBS_SCREEN_COMPONENTS = {
  DYNAMIC_FORM: "DYNAMIC_FORM",
  INQUIRY_SCREEN: "INQUIRY_SCREEN",
} as const;

// 2. Command AST (Parser Output)
export interface ParsedCommand {
  readonly raw: string;
  readonly isValid: boolean;
  readonly error?: string;
  readonly type: CommandType;
  readonly application: string;
  readonly title: string;
  readonly authLevel: number;
  readonly functionCode?: CbsRecordFunction;
  readonly screenMode: CbsScreenMode;
  readonly target?: string;
  readonly version?: string;
  readonly recordId?: string;
}

// 3. Execution Payloads & Options
export interface CommandInquiryState {
  readonly criteria?: Record<string, { value: string; operand: string }>;
  readonly currentPage?: number;
  readonly pageSize?: number;
  readonly step?: "SELECTION" | "RESULTS";
}

export interface ExecutionOptions {
  readonly user?: CbsUserSecurityContext | null;
  readonly target?: LaunchTarget;
  readonly tabId?: string;
  readonly title?: string;
  readonly screenMode?: CbsScreenMode;
  readonly recordId?: string;
  readonly formData?: Record<string, unknown>;
  readonly inquiryState?: CommandInquiryState;
  readonly silent?: boolean;
  readonly onError?: (error: string) => void;
}

// 4. Validation & Handler Contracts
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
