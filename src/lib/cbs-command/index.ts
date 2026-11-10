import { parseCbsCommand, registerCommandHandler } from "./engine/grammar";
import { validateSecurityPermissions } from "./engine/validator";
import {
  type CommandAdapter,
  type CommandTabPayload,
  getCommandAdapter,
  registerCommandAdapter,
} from "./executor/adapter";
import { executeCbsCommand } from "./executor/terminal";
import { registerDynamicAliases, resolveCommandAlias, resolveCommandTitle } from "./registry/alias";
import { extractMenuCommands, getMasterCommands } from "./registry/catalog";
import type {
  CommandHandler,
  CommandInquiryState,
  CommandValidationResult,
  ExecutionOptions,
  ParsedCommand,
} from "./types";
import { CBS_SETTINGS_EVENT, CBS_SETTINGS_TABS } from "./types";

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

export type {
  CommandAdapter,
  CommandHandler,
  CommandInquiryState,
  CommandTabPayload,
  CommandValidationResult,
  ExecutionOptions,
  ParsedCommand,
};

export {
  CBS_SETTINGS_EVENT,
  CBS_SETTINGS_TABS,
  extractMenuCommands,
  getCommandAdapter,
  getMasterCommands,
  registerCommandAdapter,
  registerCommandHandler,
  registerDynamicAliases,
  resolveCommandAlias,
  resolveCommandTitle,
  validateSecurityPermissions,
};
