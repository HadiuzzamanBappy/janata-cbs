// ============================================================================
// CBS Command Gateway Public Facade
// Pluggable, extensible micro-kernel command executor & parser.
// ============================================================================

import { parseCbsCommand, registerCommandHandler } from "./engine/grammar";
import { validateSecurityPermissions } from "./engine/validator";
import {
  type CommandAdapter,
  type CommandTabPayload,
  getCommandAdapter,
  registerCommandAdapter,
} from "./executor/adapter";
import { executeCbsCommand } from "./executor/terminal";
import {
  getCanonicalScreenKey,
  registerDynamicAliases,
  resolveCommandAlias,
  resolveCommandTitle,
} from "./registry/alias";
import {
  extractMenuCommands,
  getAllRegisteredCommands,
  MASTER_COMMAND_DEFINITIONS,
} from "./registry/catalog";
import type {
  CommandHandler,
  CommandValidationResult,
  ExecutionOptions,
  ParsedCommand,
} from "./types";
import { CBS_SETTINGS_EVENT, CBS_SETTINGS_TABS } from "./types";

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
   * Register a new custom protocol handler (e.g. REPORT, WORKFLOW, BATCH).
   */
  registerHandler: (handler: CommandHandler, prepend = true): (() => void) => {
    return registerCommandHandler(handler, prepend);
  },

  /**
   * Ingest dynamic control commands from SC_CONTROL and register aliases at runtime.
   */
  registerAliases: registerDynamicAliases,

  /**
   * Resolve shorthand aliases (e.g. "MD" -> "SC.MENU.DESIGN").
   */
  resolveAlias: resolveCommandAlias,

  /**
   * Resolve human-readable screen title.
   */
  resolveTitle: resolveCommandTitle,

  /**
   * Master registry of bootstrap system commands.
   */
  getCommands: () => MASTER_COMMAND_DEFINITIONS,

  /**
   * Canonical screen key resolver.
   */
  getCanonicalScreenKey,
};

export type {
  CommandAdapter,
  CommandHandler,
  CommandTabPayload,
  CommandValidationResult,
  ExecutionOptions,
  ParsedCommand,
};
// Exports
export {
  CBS_SETTINGS_EVENT,
  CBS_SETTINGS_TABS,
  extractMenuCommands,
  getAllRegisteredCommands,
  getCanonicalScreenKey,
  getCommandAdapter,
  registerCommandAdapter,
  registerCommandHandler,
  registerDynamicAliases,
  resolveCommandAlias,
  resolveCommandTitle,
  validateSecurityPermissions,
};
