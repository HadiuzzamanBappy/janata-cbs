import { hasAccessibilityRight } from "@/lib/cbs-access";
import { CBS_FUNCTION_DEFINITIONS, CbsRecordFunction, type CbsUserSecurityContext } from "@/types";
import type { CommandValidationResult, ParsedCommand } from "../types";

/**
 * Validates whether the active user has permissions to execute the command.
 */
export function validateSecurityPermissions(
  command: ParsedCommand,
  user: CbsUserSecurityContext | null | undefined,
): CommandValidationResult {
  // 1. Syntax check
  if (!command.isValid) {
    return {
      allowed: false,
      reason: command.error || "Invalid command syntax.",
    };
  }

  // 2. Settings dialog is accessible to all authenticated users
  if (command.type === "SETTINGS") {
    return { allowed: true };
  }

  // 3. User session check
  if (!user) {
    return {
      allowed: false,
      reason: "No active user session found. Please sign in to execute commands.",
    };
  }

  // 4. Command line terminal permission check
  if (user.commandLine === false) {
    return {
      allowed: false,
      reason: "Access Denied: Your profile does not have Command Line access enabled.",
    };
  }

  // 5. Function rights (RIDASHL) check via centralized access helper
  if (command.functionCode && !hasAccessibilityRight(user.accessibility, command.functionCode)) {
    const funcName = CBS_FUNCTION_DEFINITIONS[command.functionCode]?.label || command.functionCode;
    return {
      allowed: false,
      reason: `Permission Denied: User lacks ${funcName} rights for application ${command.application}.`,
      requiredRight: command.functionCode,
    };
  }

  // 6. Zero-auth (trailing comma) authorizes in the same step, so it needs the Authorize right too.
  // `/api/proxy` enforces the same rule (`verifyZeroAuthAccess`) on every level-0 mutation.
  if (
    command.authLevel === 0 &&
    !hasAccessibilityRight(user.accessibility, CbsRecordFunction.AUTHORIZE)
  ) {
    return {
      allowed: false,
      reason: `Permission Denied: Zero-auth entry (${command.application},) requires Authorize rights.`,
      requiredRight: CbsRecordFunction.AUTHORIZE,
    };
  }

  return { allowed: true };
}
