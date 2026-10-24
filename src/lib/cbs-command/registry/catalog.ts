// ============================================================================
// Master Static Command Definitions
// Lean MVP: clean canonical command names without legacy prefixes + 1 short alias.
// ============================================================================

import type { MenuItem, SystemCommandItem } from "@/lib/data-schemas";

export const MASTER_COMMAND_DEFINITIONS: SystemCommandItem[] = [
  // 1. System Administrative Canvases
  {
    command: "SC.MENU.DESIGN",
    title: "Menu Hierarchy",
    aliases: ["MD", "SC.MENU.TREE"],
    actionType: "SCREEN",
  },
  {
    command: "SC.MODEL.CONFIG",
    title: "Model Config",
    aliases: ["MC", "SC.MODEL.BUILDER"],
    actionType: "SCREEN",
  },
  {
    command: "SC.FORM.CONFIG",
    title: "Form Design",
    aliases: ["FC", "SC.FORM.BUILDER"],
    actionType: "SCREEN",
  },
  {
    command: "SC.INQUIRY.CONFIG",
    title: "Inquiry Design",
    aliases: ["IC", "SC.INQUIRY"],
    actionType: "SCREEN",
  },

  // 2. Settings Dialog Commands
  {
    command: "SETTINGS:PROFILE",
    title: "User Profile Settings",
    aliases: ["PROFILE"],
    actionType: "SETTINGS",
  },
  {
    command: "SETTINGS:APPEARANCE",
    title: "Appearance & Theme",
    aliases: ["THEME"],
    actionType: "SETTINGS",
  },
  {
    command: "SETTINGS:SECURITY",
    title: "Security & Credentials",
    aliases: ["SECURITY"],
    actionType: "SETTINGS",
  },

  // 3. Quick Actions
  {
    command: "ACTION:TOGGLE_THEME",
    title: "Toggle Dark / Light Theme",
    aliases: ["DARK"],
    actionType: "THEME",
  },
  {
    command: "ACTION:LOGOUT",
    title: "Sign Out Session",
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
          command: item.command,
          title: item.label,
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
