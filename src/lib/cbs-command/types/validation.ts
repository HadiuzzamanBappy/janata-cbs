/**
 * RBAC Validation & Security Contracts for CBS Command Gateway
 */

import type { FunctionRightCode } from "./command";

/**
 * Result returned by the security validator before executing a command.
 */
export interface CommandValidationResult {
  /** True if the user has clearance to execute this command */
  allowed: boolean;
  /** Human-readable explanation if access is blocked */
  reason?: string;
  /** The specific RIDASH function right the user is missing (e.g. 'D', 'A') */
  requiredRight?: FunctionRightCode;
}

/**
 * Minimal user security profile required to validate command clearance.
 * Matches the authenticated user session in the session store.
 */
export interface UserSecurityProfile {
  /** Unique ID of the authenticated user */
  userId?: string;
  /** Whether the user has permission to use the terminal command line */
  commandLine?: boolean;
  /** Raw accessibility string from CBS profile (e.g. "RIDASH" or "RS") */
  accessibility?: string;
  /** Parsed array of allowed function codes (e.g. ["R", "I", "S"]) */
  functionRights?: string[];
  /** Roles assigned to the user (e.g. ["TELLER", "ADMIN"]) */
  userRole?: string[];
}
