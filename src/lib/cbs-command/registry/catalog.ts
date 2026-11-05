// ============================================================================
// Master Static Command Definitions
// Lean MVP: clean canonical command names without legacy prefixes + 1 short alias.
// ============================================================================

import type { ControlCommand, MenuItem } from "@/lib/data-schemas";

export const MASTER_COMMAND_DEFINITIONS: ControlCommand[] = [
  // 1. System Administrative Canvases
  {
    command: "SC.MENU.DESIGN",
    title: "Menu Hierarchy",
    aliases: ["MD"],
    actionType: "SCREEN",
  },
  {
    command: "SC.MODEL.CONFIG",
    title: "Model Config",
    aliases: ["MC"],
    actionType: "SCREEN",
  },
  {
    command: "SC.FORM.CONFIG",
    title: "Form Design",
    aliases: ["FC"],
    actionType: "SCREEN",
  },
  {
    command: "SC.INQUIRY.CONFIG",
    title: "Inquiry Design",
    aliases: ["INQ"],
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
];

export function getAllRegisteredCommands(): ControlCommand[] {
  return MASTER_COMMAND_DEFINITIONS;
}

export function extractMenuCommands(items: MenuItem[]): ControlCommand[] {
  const result: ControlCommand[] = [];
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
