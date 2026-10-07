/**
 * CBS Command Gateway Public Facade
 *
 * Parallel to `cbs-client`, `cbsCommand` is the single front door for:
 * - Parsing CBS formulas (including Comma Versions & authLevel 0)
 * - Pre-execution RBAC security checks
 * - Executing commands across tabs, multi-monitor popups, and modal dialogs
 * - Master alias mapping
 */

import { parseCbsCommand } from "./engine/grammar";
import { validateSecurityPermissions } from "./engine/validator";
import { executeCbsCommand } from "./executor/terminal";
import { getCanonicalScreenKey, resolveCommandAlias } from "./registry/alias";
import { MASTER_COMMAND_DEFINITIONS } from "./registry/catalog";
import type { ParsedCommand } from "./types/command";
import type { ExecutionOptions } from "./types/execution";

export const cbsCommand = {
  /**
   * Execute a command from anywhere (Command bar, sidebar, button, keyboard shortcut).
   */
  execute: (commandStr: string, options?: ExecutionOptions): ParsedCommand => {
    return executeCbsCommand(commandStr, options);
  },

  /**
   * Parse a raw CBS command string into structured metadata without executing.
   */
  parse: (rawInput: string): ParsedCommand => {
    return parseCbsCommand(rawInput);
  },

  /**
   * Check whether a given user has security clearance to execute a command.
   */
  validate: validateSecurityPermissions,

  /**
   * Resolve shorthand aliases (e.g. "MD" -> "SC.MENU.DESIGN").
   */
  resolveAlias: resolveCommandAlias,

  /**
   * Master registry of all statically registered system commands.
   */
  getCommands: () => MASTER_COMMAND_DEFINITIONS,

  /**
   * Canonical bespoke screen key resolver (used by React screen registry).
   */
  getScreenKey: getCanonicalScreenKey,
};

export default cbsCommand;

// Re-export core functions
export { parseCbsCommand } from "./engine/grammar";
export { validateSecurityPermissions } from "./engine/validator";
export { getCanonicalScreenKey, resolveCommandAlias } from "./registry/alias";
export {
  extractMenuCommands,
  getAllRegisteredCommands,
  MASTER_COMMAND_DEFINITIONS,
} from "./registry/catalog";
// Re-export contracts
export * from "./types/command";
export * from "./types/execution";
export * from "./types/validation";
