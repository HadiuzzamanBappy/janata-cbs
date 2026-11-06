import type { ControlCommand } from "@/lib/data-schemas";
import { MASTER_COMMAND_DEFINITIONS } from "./catalog";

const CANONICAL_SCREEN_MAP = new Map<string, string>();
const CANONICAL_TITLE_MAP = new Map<string, string>();

/**
 * Registers commands and aliases into fast O(1) screen and title lookup maps.
 */
export function registerDynamicAliases(controls: readonly ControlCommand[]): void {
  for (const cmd of controls) {
    if (cmd.controlAction !== "SCREEN") continue;

    const keys = [cmd.command, ...(cmd.aliases || [])];
    for (const key of keys) {
      const upper = key.trim().toUpperCase();
      CANONICAL_SCREEN_MAP.set(upper, cmd.command);
      if (cmd.title) {
        CANONICAL_TITLE_MAP.set(upper, cmd.title);
      }
    }
  }
}

// Bootstrap with static system catalog
registerDynamicAliases(MASTER_COMMAND_DEFINITIONS);

/**
 * Returns the canonical screen identifier for a given raw command or alias.
 */
export function getCanonicalScreenKey(input: string): string | undefined {
  if (!input) return undefined;
  return CANONICAL_SCREEN_MAP.get(input.trim().toUpperCase());
}

/**
 * Resolves an alias to its canonical target command, or returns the input if already canonical.
 */
export function resolveCommandAlias(input: string): string {
  if (!input) return "";
  const clean = input.trim().toUpperCase();
  return CANONICAL_SCREEN_MAP.get(clean) || clean;
}

/**
 * Returns the human-readable title for a given command or alias.
 */
export function resolveCommandTitle(input: string): string | undefined {
  if (!input) return undefined;
  return CANONICAL_TITLE_MAP.get(input.trim().toUpperCase());
}
