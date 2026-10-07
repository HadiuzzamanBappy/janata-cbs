/**
 * RBAC Validation & Security Types for CBS Command Gateway
 */

import type { FunctionRightCode } from "./command";

export interface CommandValidationResult {
  allowed: boolean;
  reason?: string;
  requiredRight?: FunctionRightCode;
}

export interface UserSecurityProfile {
  userId?: string;
  commandLine?: boolean;
  accessibility?: string;
  functionRights?: string[];
  userRole?: string[];
}
