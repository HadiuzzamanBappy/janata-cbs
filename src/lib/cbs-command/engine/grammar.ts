import { FormCommandHandler } from "../handlers/form-handler";
import { InquiryCommandHandler } from "../handlers/inquiry-handler";
import { SettingsCommandHandler } from "../handlers/settings-handler";
import type { CommandHandler, ParsedCommand } from "../types";

/**
 * Registry of active command protocol handlers evaluated in order of specificity.
 * Fallback (FormCommandHandler) is evaluated last.
 */
const registeredHandlers: CommandHandler[] = [
  new SettingsCommandHandler(),
  new InquiryCommandHandler(),
  new FormCommandHandler(),
];

/**
 * Register a new custom protocol handler at runtime (e.g. REPORT, WORKFLOW, BATCH)
 */
export function registerCommandHandler(handler: CommandHandler, prepend = true): () => void {
  if (prepend) {
    registeredHandlers.unshift(handler);
  } else {
    // Insert before fallback FormCommandHandler
    const fallbackIdx = registeredHandlers.findIndex((h) => h.type === "FORM");
    if (fallbackIdx !== -1) {
      registeredHandlers.splice(fallbackIdx, 0, handler);
    } else {
      registeredHandlers.push(handler);
    }
  }

  return () => {
    const idx = registeredHandlers.indexOf(handler);
    if (idx !== -1) {
      registeredHandlers.splice(idx, 1);
    }
  };
}

/**
 * Returns the active handler for a given command string
 */
export function findCommandHandler(rawInput: string): CommandHandler {
  const trimmedUpper = rawInput.trim().toUpperCase();
  return (
    registeredHandlers.find((h) => h.canHandle(rawInput, trimmedUpper)) ??
    registeredHandlers[registeredHandlers.length - 1]
  );
}

/**
 * Parses raw terminal command string into a strongly typed ParsedCommand AST.
 */
export function parseCbsCommand(rawInput: string): ParsedCommand {
  const trimmed = rawInput ? rawInput.trim() : "";

  // 1. Rejection: Empty string
  if (!trimmed) {
    return {
      raw: rawInput,
      isValid: false,
      error: "Command cannot be empty.",
      type: "FORM",
      application: "",
      title: "",
      authLevel: 1,
      screenMode: "IDLE",
    };
  }

  // 2. Syntax validation: First token must start with a valid alphanumeric letter or known prefix
  const firstToken = trimmed.split(/[\s,]+/)[0];
  if (!/^[A-Z][A-Z0-9._-]*$/i.test(firstToken) && !firstToken.includes(":")) {
    return {
      raw: trimmed,
      isValid: false,
      error: `Invalid application or command identifier: "${firstToken}"`,
      type: "FORM",
      application: "",
      title: "",
      authLevel: 1,
      screenMode: "IDLE",
    };
  }

  // 3. Delegate to matching pluggable command handler
  const handler = findCommandHandler(trimmed);
  return handler.parse(trimmed, trimmed.toUpperCase());
}
