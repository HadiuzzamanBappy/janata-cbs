/**
 * Dispatch & Execution Option Contracts for CBS Command Gateway
 */

import type { ParsedCommand, ScreenMode } from "./command";
import type { UserSecurityProfile } from "./validation";

export type LaunchTarget = "workspace" | "popup";

export interface ExecutionOptions {
  /** Optional user override for explicit permission validation */
  user?: UserSecurityProfile | null;
  /** Target execution display: internal tab ("workspace") or external detached popup ("popup") */
  target?: LaunchTarget;
  /** Explicit title override for window or tab header */
  title?: string;
  /** Explicit screen mode override (IDLE, CREATE, EDIT, VIEW) */
  screenMode?: ScreenMode;
  /** Explicit record ID override */
  searchRecordId?: string;
  /** Preset criteria for inquiry grid queries */
  criteria?: Record<string, { value: string; operand: string }>;
  /** Staged form data passed into the screen */
  formData?: Record<string, unknown>;
  /** Page configuration */
  currentPage?: number;
  pageSize?: number;
  /** Selection vs Results step */
  step?: "SELECTION" | "RESULTS";
  /** If true, silences non-critical error toasts */
  silent?: boolean;
  /** Optional headless callback for error reporting (useful in headless/testing environments) */
  onError?: (error: string) => void;
  /** Optional callback upon successful dispatch */
  onSuccess?: (command: ParsedCommand) => void;
}
