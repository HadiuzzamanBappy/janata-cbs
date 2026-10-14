// ============================================================================
// Master Static Command Definitions
// Lean MVP: clean canonical command names without legacy prefixes + 1 short alias.
// ============================================================================

import type { MenuItem, SystemCommandItem } from "@/lib/data-schemas";

export const MASTER_COMMAND_DEFINITIONS: SystemCommandItem[] = [
  // 1. System Administrative Canvases
  {
    id: "SC.MENU",
    title: "Menu Item",
    category: "System Administration",
    command: "SC.MENU",
    aliases: ["MNU"],
    actionType: "SCREEN",
  },
  {
    id: "SC.MENU.DESIGN",
    title: "Menu Hierarchy",
    category: "System Administration",
    command: "SC.MENU.DESIGN",
    aliases: ["MD", "SC.MENU.TREE"],
    actionType: "SCREEN",
  },
  {
    id: "SC.USER.GROUP",
    title: "User Group",
    category: "System Administration",
    command: "SC.USER.GROUP",
    aliases: ["UG"],
    actionType: "SCREEN",
  },
  {
    id: "SC.MODEL.CONFIG",
    title: "Model Config",
    category: "System Administration",
    command: "SC.MODEL.CONFIG",
    aliases: ["MC", "SC.MODEL.BUILDER"],
    actionType: "SCREEN",
  },
  {
    id: "SC.FORM.CONFIG",
    title: "Form Design",
    category: "System Administration",
    command: "SC.FORM.CONFIG",
    aliases: ["FC", "SC.FORM.BUILDER"],
    actionType: "SCREEN",
  },
  {
    id: "SC.REPORT.BUILDER",
    title: "Report Studio",
    category: "System Administration",
    command: "SC.REPORT.BUILDER",
    aliases: ["RB"],
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
