// ============================================================================
// Dispatch & Execution Option Contracts for CBS Command Gateway
// ============================================================================

import type { ParsedCommand, ScreenMode } from "./command";
import type { UserSecurityProfile } from "./validation";

export type LaunchTarget = "workspace" | "popup";

export interface ExecutionOptions {
  /** Optional user override for explicit permission validation */
  readonly user?: UserSecurityProfile | null;
  /** Target execution display: internal tab ("workspace") or external detached popup ("popup") */
  readonly target?: LaunchTarget;
  /** Explicit title override for window or tab header */
  readonly title?: string;
  /** Explicit screen mode override (IDLE, S, I, D, A, R, H) */
  readonly screenMode?: ScreenMode;
  /** Explicit record ID override */
  readonly searchRecordId?: string;
  /** Preset criteria for inquiry grid queries */
  readonly criteria?: Record<string, { value: string; operand: string }>;
  /** Staged form data passed into the screen */
  readonly formData?: Record<string, unknown>;
  /** Page configuration */
  readonly currentPage?: number;
  readonly pageSize?: number;
  /** Selection vs Results step */
  readonly step?: "SELECTION" | "RESULTS";
  /** If true, silences non-critical error toasts */
  readonly silent?: boolean;
  /** Optional headless callback for error reporting (useful in headless/testing environments) */
  readonly onError?: (error: string) => void;
  /** Explicit tab ID override for window-to-shell state mapping */
  readonly tabId?: string;
  /** Optional callback upon successful dispatch */
  readonly onSuccess?: (command: ParsedCommand) => void;
}
