import type { MenuItem } from "@/lib/schemas";
import type { SystemCommandItem } from "@/lib/core";

export function extractMenuCommands(items: MenuItem[]): SystemCommandItem[] {
  const result: SystemCommandItem[] = [];
  function traverse(list: MenuItem[]) {
    for (const item of list) {
      if (item.command) {
        result.push({
          id: item.id || item.command,
          title: item.label,
          category: "Navigation & Operations",
          description: `Execute ${item.label} [${item.command}]`,
          command: item.command,
          allowedRoles: ["*"],
          actionType: "SCREEN",
        });
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  }
  traverse(items);
  return result;
}

export function filterVisibleCommands(
  commands: SystemCommandItem[],
  searchQuery: string,
): SystemCommandItem[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => {
    const titleMatch = c.title.toLowerCase().includes(q);
    const cmdMatch = c.command.toLowerCase().includes(q);
    const recordIdMatch = Boolean(c.recordId && c.recordId.toLowerCase().includes(q));
    const controlNameMatch = Boolean(c.controlName && c.controlName.toLowerCase().includes(q));
    const aliasMatch = Boolean(c.aliases?.some((a) => a.toLowerCase().includes(q)));
    return titleMatch || cmdMatch || recordIdMatch || controlNameMatch || aliasMatch;
  });
}

export function groupCommandsByCategory(
  commands: SystemCommandItem[],
): [string, SystemCommandItem[]][] {
  const map = new Map<string, SystemCommandItem[]>();
  for (const cmd of commands) {
    const list = map.get(cmd.category) ?? [];
    list.push(cmd);
    map.set(cmd.category, list);
  }
  return Array.from(map.entries());
}
