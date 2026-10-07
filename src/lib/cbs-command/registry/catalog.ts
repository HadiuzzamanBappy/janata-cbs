/**
 * Master Static Command Definitions
 * Lean MVP: clean canonical command names without legacy prefixes + 1 short alias.
 */

import type { MenuItem, SystemCommandItem } from "@/lib/schemas";

export const MASTER_COMMAND_DEFINITIONS: SystemCommandItem[] = [
  // 1. System Administrative Canvases
  {
    id: "MENU",
    title: "Menu Item Catalog",
    category: "System Administration",
    command: "MENU",
    aliases: ["MNU"],
    actionType: "SCREEN",
  },
  {
    id: "MENU.DESIGN",
    title: "Menu Hierarchy Designer",
    category: "System Administration",
    command: "MENU.DESIGN",
    aliases: ["MD"],
    actionType: "SCREEN",
  },
  {
    id: "USER.GROUP",
    title: "User Group & Permissions",
    category: "System Administration",
    command: "USER.GROUP",
    aliases: ["UG"],
    actionType: "SCREEN",
  },
  {
    id: "MODEL.CONFIG",
    title: "Data Model & Schema Config",
    category: "System Administration",
    command: "MODEL.CONFIG",
    aliases: ["MC"],
    actionType: "SCREEN",
  },
  {
    id: "REPORT.DESIGN",
    title: "Report Studio",
    category: "System Administration",
    command: "REPORT.DESIGN",
    aliases: ["RS"],
    actionType: "SCREEN",
  },

  // 2. Settings Dialog Commands
  {
    id: "SETTINGS:PROFILE",
    title: "User Profile Settings",
    category: "Preferences",
    command: "SETTINGS:PROFILE",
    aliases: ["PROFILE"],
    actionType: "SETTINGS",
    settingsTabId: "profile",
  },
  {
    id: "SETTINGS:APPEARANCE",
    title: "Appearance & Theme",
    category: "Preferences",
    command: "SETTINGS:APPEARANCE",
    aliases: ["THEME"],
    actionType: "SETTINGS",
    settingsTabId: "appearance",
  },
  {
    id: "SETTINGS:SECURITY",
    title: "Security & Credentials",
    category: "Preferences",
    command: "SETTINGS:SECURITY",
    aliases: ["SECURITY"],
    actionType: "SETTINGS",
    settingsTabId: "security",
  },

  // 3. Quick Actions
  {
    id: "ACTION:TOGGLE_THEME",
    title: "Toggle Dark / Light Theme",
    category: "Quick Actions",
    command: "ACTION:TOGGLE_THEME",
    aliases: ["DARK"],
    actionType: "THEME",
  },
  {
    id: "ACTION:LOGOUT",
    title: "Sign Out Session",
    category: "Quick Actions",
    command: "ACTION:LOGOUT",
    aliases: ["LOGOUT"],
    actionType: "LOGOUT",
  },
];

export function getAllRegisteredCommands(): SystemCommandItem[] {
  return MASTER_COMMAND_DEFINITIONS;
}

export function extractMenuCommands(items: MenuItem[]): SystemCommandItem[] {
  const result: SystemCommandItem[] = [];
  function traverse(list: MenuItem[]) {
    for (const item of list) {
      if (item.command) {
        result.push({
          id: item.id || item.command,
          title: item.label,
          category: "Navigation & Operations",
          command: item.command,
          aliases: [],
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
