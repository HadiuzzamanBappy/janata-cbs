import type { ControlCommand } from "@/lib/data-schemas";

/**
 * Filter commands strictly on visible UI fields:
 * Title, Command, Alias ID, and Control Name.
 */
export function filterVisibleCommands(
  commands: ControlCommand[],
  searchQuery: string,
): ControlCommand[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => {
    const titleMatch = c.title.toLowerCase().includes(q);
    const cmdMatch = c.command.toLowerCase().includes(q);
    const aliasMatch = Boolean(c.aliases?.some((a) => a.toLowerCase().includes(q)));
    return titleMatch || cmdMatch || aliasMatch;
  });
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
