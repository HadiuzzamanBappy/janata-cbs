/**
 * CBS User Command Validator
 *
 * Validates parsed CBS commands against the active CurrentUser profile:
 * 1. Checks `commandLine` permission (bool_value in user.json).
 * 2. Checks `accessibility` (RIDASH string e.g. "RIDASH" in user.json).
 * 3. Enforces that functions R, I, D, A, S, H are permitted for the user.
 */

import type { CurrentUser } from "@/lib/schemas";
import type { FunctionRightCode, ParsedCommand } from "./command-parser";

export interface CommandValidationResult {
  allowed: boolean;
  reason?: string;
}

const FUNCTION_NAME_MAP: Record<FunctionRightCode, string> = {
  R: "Read / Reverse ('R')",
  I: "Input / Create ('I')",
  D: "Delete ('D')",
  A: "Amend / Authorise ('A')",
  S: "See / View ('S')",
  H: "Hold ('H')",
};

/**
 * Validates whether the given user has rights to execute the parsed command.
 */
export function validateCommandForUser(
  command: ParsedCommand,
  user: CurrentUser | null | undefined,
): CommandValidationResult {
  // If command syntax itself is invalid, reject immediately
  if (!command.isValid) {
    return {
      allowed: false,
      reason: command.error || "Invalid command syntax",
    };
  }

  // Settings & standard UI actions are universally available to authenticated users
  if (command.type === "SETTINGS" || command.type === "ACTION") {
    return { allowed: true };
  }

  // If no user session is loaded
  if (!user) {
    return {
      allowed: false,
      reason: "No active user session found. Please log in.",
    };
  }

  // 1. Check commandLine flag from user profile
  // If user has `commandLine: false`, they cannot execute raw commands
  if (user.commandLine === false) {
    return {
      allowed: false,
      reason: "Access Denied: Your profile does not have Command Line access enabled.",
    };
  }

  // 2. Check RIDASH Function Rights if command requested a specific function
  if (command.functionCode) {
    const userRights = user.functionRights ?? (user.accessibility ? user.accessibility.split("") : []);

    const hasPermission = userRights.includes(command.functionCode);
    if (!hasPermission) {
      const funcName = FUNCTION_NAME_MAP[command.functionCode] || command.functionCode;
      return {
        allowed: false,
        reason: `Permission Denied: User lacks ${funcName} rights for application ${command.application}.`,
      };
    }
  }

  return { allowed: true };
}
