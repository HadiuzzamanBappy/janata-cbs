import { parseCbsCommand, registerCommandHandler } from "./engine/grammar";
import { validateSecurityPermissions } from "./engine/validator";
import {
  type CbsNotification,
  type CommandTabPayload,
  notifyUser,
  registerCommandAdapter,
} from "./executor/adapter";
import { executeCbsCommand } from "./executor/terminal";
import { registerDynamicAliases, resolveCommandAlias, resolveCommandTitle } from "./registry/alias";
import { extractMenuCommands, getMasterCommands } from "./registry/catalog";
import type { CommandHandler, ExecutionOptions, ParsedCommand } from "./types";
import { CBS_SETTINGS_EVENT } from "./types";

/**
 * Universal CBS Command Gateway facade.
 */
export const cbsCommand = {
  execute: (commandStr: string, options?: ExecutionOptions): ParsedCommand => {
    return executeCbsCommand(commandStr, options);
  },
  parse: (rawInput: string): ParsedCommand => {
    return parseCbsCommand(rawInput);
  },
  validate: validateSecurityPermissions,
  registerHandler: (handler: CommandHandler, prepend = true): (() => void) => {
    return registerCommandHandler(handler, prepend);
  },
  registerAliases: registerDynamicAliases,
  resolveAlias: resolveCommandAlias,
  resolveTitle: resolveCommandTitle,
  getCommands: getMasterCommands,
};

export type { CbsNotification, CommandHandler, CommandTabPayload, ExecutionOptions, ParsedCommand };

export {
  CBS_SETTINGS_EVENT,
  extractMenuCommands,
  getMasterCommands,
  notifyUser,
  registerCommandAdapter,
  registerCommandHandler,
  registerDynamicAliases,
  resolveCommandAlias,
  resolveCommandTitle,
  validateSecurityPermissions,
};
