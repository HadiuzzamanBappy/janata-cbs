/**
 * Master Single-Source-of-Truth Alias Map for Screen Resolution.
 * Generated dynamically from MASTER_COMMAND_DEFINITIONS to guarantee absolute DRY.
 */

import { MASTER_COMMAND_DEFINITIONS } from "./catalog";

/**
 * Maps any alias (e.g. "MD", "MNU", "UG", "MC") or command to its canonical command ID ("MENU.DESIGN")
 */
const CANONICAL_SCREEN_MAP = new Map<string, string>();

/**
 * Maps any alias (e.g. "MD", "MNU", "UG", "MC") or command to its catalog title ("Menu Hierarchy Designer")
 */
const CANONICAL_TITLE_MAP = new Map<string, string>();

for (const cmd of MASTER_COMMAND_DEFINITIONS) {
  if (cmd.actionType === "SCREEN") {
    CANONICAL_SCREEN_MAP.set(cmd.command.toUpperCase(), cmd.command);
    if (cmd.title) {
      CANONICAL_TITLE_MAP.set(cmd.command.toUpperCase(), cmd.title);
    }

    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        CANONICAL_SCREEN_MAP.set(alias.toUpperCase(), cmd.command);
        if (cmd.title) {
          CANONICAL_TITLE_MAP.set(alias.toUpperCase(), cmd.title);
        }
      }
    }
  }
}

/**
 * Returns the canonical screen command identifier for a given raw command or alias.
 * Returns undefined if input is not a registered canvas screen.
 *
 * @example
 * getCanonicalScreenKey("MD") -> "MENU.DESIGN"
 * getCanonicalScreenKey("MENU.DESIGN") -> "MENU.DESIGN"
 * getCanonicalScreenKey("UNKNOWN") -> undefined
 */
export function getCanonicalScreenKey(input: string): string | undefined {
  if (!input) return undefined;
  const clean = input.trim().toUpperCase();
  return CANONICAL_SCREEN_MAP.get(clean);
}

/**
 * Resolves a raw command or shorthand alias into its canonical command identifier.
 * If no alias is registered, returns the original input string.
 *
 * @example
 * resolveCommandAlias("MD") -> "MENU.DESIGN"
 * resolveCommandAlias("USER") -> "USER"
 */
export function resolveCommandAlias(raw: string): string {
  if (!raw) return "";
  const clean = raw.trim().toUpperCase();
  return CANONICAL_SCREEN_MAP.get(clean) || clean;
}

/**
 * Resolves a raw command or alias into its registered catalog title.
 * If not in catalog, returns undefined.
 *
 * @example
 * resolveCommandTitle("MD") -> "Menu Hierarchy Designer"
 * resolveCommandTitle("MC") -> "Data Model & Schema Config"
 */
export function resolveCommandTitle(raw: string): string | undefined {
  if (!raw) return undefined;
  const clean = raw.trim().toUpperCase();
  return CANONICAL_TITLE_MAP.get(clean);
}
