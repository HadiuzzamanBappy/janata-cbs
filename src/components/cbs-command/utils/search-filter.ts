import type { ControlCommand } from "@/lib/data-schemas";

function getMatchScore(c: ControlCommand, q: string): number {
  const title = c.title.toLowerCase();
  const cmd = c.command.toLowerCase();
  const aliases = (c.aliases ?? []).map((a) => a.toLowerCase());

  // 0: Exact match on command, alias, or title
  if (cmd === q || aliases.includes(q) || title === q) return 0;
  // 1: Prefix match on command, alias, or title
  if (cmd.startsWith(q) || aliases.some((a) => a.startsWith(q)) || title.startsWith(q)) return 1;
  // 2: Substring match
  if (cmd.includes(q) || aliases.some((a) => a.includes(q)) || title.includes(q)) return 2;
  return -1;
}

/**
 * Filter and rank commands strictly on visible UI fields:
 * Title, Command, Alias ID, and Control Name (exact matches ranked first).
 */
export function filterVisibleCommands(
  commands: ControlCommand[],
  searchQuery: string,
): ControlCommand[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return commands;

  return commands
    .map((cmd, index) => ({ cmd, index, score: getMatchScore(cmd, q) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.cmd);
}

/**
 * Group search results by category for <CommandGroup /> sections.
 */
export function groupCommandsByCategory(commands: ControlCommand[]): [string, ControlCommand[]][] {
  const map = new Map<string, ControlCommand[]>();
  for (const cmd of commands) {
    const category =
      cmd.controlAction === "SETTINGS" || cmd.controlType === "SETTINGS"
        ? "Preferences"
        : cmd.command.startsWith("SC.")
          ? "System Administration"
          : "Applications & Screens";

    const list = map.get(category) ?? [];
    list.push(cmd);
    map.set(category, list);
  }
  return Array.from(map.entries());
}
