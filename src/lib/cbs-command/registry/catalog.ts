/**
 * Master Static Command Definitions for Navigation, System Administration, and Quick Actions
 */

import type { SystemCommandItem } from "@/lib/schemas";

export const MASTER_COMMAND_DEFINITIONS: SystemCommandItem[] = [
  // 1. Security & Authentication
  {
    id: "USER.CHANGE.PASS",
    title: "Change Password",
    category: "Security & Authentication",
    description: "User change security password profile",
    command: "USER.CHANGE.PASS",
    controlName: "USER.CHANGE.PASS",
    recordId: "PASS",
    aliases: ["PWD"],
    componentName: "USER_CHANGE_PASS",
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },

  // 2. System Administrative Bespoke Canvases
  {
    id: "SC.MENU",
    title: "Menu Item Catalog",
    category: "System Administration",
    description: "Manage individual menu actions and terminal commands",
    command: "SC.MENU",
    controlName: "MENU",
    recordId: "MENU",
    aliases: ["MENU"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },
  {
    id: "SC.MENU.DESIGN",
    title: "Menu Hierarchy Designer",
    category: "System Administration",
    description: "Visual navigation hierarchy tree designer",
    command: "SC.MENU.DESIGN",
    controlName: "MENU.TREE",
    recordId: "MENU.TREE",
    aliases: ["MD"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },
  {
    id: "SC.USER.GROUP",
    title: "User Group & Menu Permissions",
    category: "System Administration",
    description: "Role-Based Access Control and menu authorization matrix",
    command: "SC.USER.GROUP",
    controlName: "USER.GROUP",
    recordId: "USER.GROUP",
    aliases: ["UG"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },
  {
    id: "SC.MODEL.CONFIG",
    title: "Data Model & Schema Config",
    category: "System Administration",
    description: "Core Banking data dictionary and field attribute designer",
    command: "SC.MODEL.CONFIG",
    controlName: "MODEL.CONFIG",
    recordId: "MODEL.CONFIG",
    aliases: ["MC"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },
  {
    id: "SC.COB.REGISTRY",
    title: "COB Service Registry & Batch Pipeline",
    category: "System Administration",
    description: "Close of Business end-of-day batch stages and service job pipeline",
    command: "SC.COB.REGISTRY",
    controlName: "COB.REGISTRY",
    recordId: "SYSTEM",
    aliases: ["COB"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },
  {
    id: "SC.USER.PASS.RESET",
    title: "User Password Reset & Account Security",
    category: "System Administration",
    description: "Unlock accounts, issue temporary credentials, and manage staff security",
    command: "SC.USER.PASS.RESET",
    controlName: "USER.PASS.RESET",
    recordId: "USER.PASS.RESET",
    aliases: ["PR"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },
  {
    id: "SC.INQUIRY",
    title: "Inquiry & Grid Designer",
    category: "System Administration",
    description: "Visual query designer, search criteria, and report column builder",
    command: "SC.INQUIRY",
    controlName: "INQUIRY",
    recordId: "INQUIRY",
    aliases: ["ID"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },
  {
    id: "SC.REPORT.DESIGN",
    title: "Report Studio",
    category: "System Administration",
    description: "Interactive visual report template designer",
    command: "SC.REPORT.DESIGN",
    controlName: "REPORT.DESIGN",
    recordId: "REPORT.DESIGN",
    aliases: ["RS"],
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },

  // 3. Settings Dialog Modal Commands
  {
    id: "SETTINGS:PROFILE",
    title: "User Profile Settings",
    category: "Preferences",
    command: "SETTINGS:PROFILE",
    controlName: "SETTINGS:PROFILE",
    recordId: "PROFILE",
    aliases: ["PROFILE"],
    description: "Manage personal staff profile and preferences",
    allowedRoles: ["*"],
    actionType: "SETTINGS",
    settingsTabId: "profile",
  },
  {
    id: "SETTINGS:APPEARANCE",
    title: "Appearance & Theme Settings",
    category: "Preferences",
    command: "SETTINGS:APPEARANCE",
    controlName: "SETTINGS:APPEARANCE",
    recordId: "APPEARANCE",
    aliases: ["THEME", "APPEARANCE"],
    description: "Customize theme, dark mode, and visual styles",
    allowedRoles: ["*"],
    actionType: "SETTINGS",
    settingsTabId: "appearance",
  },
  {
    id: "SETTINGS:SECURITY",
    title: "Security & Credentials Settings",
    category: "Preferences",
    command: "SETTINGS:SECURITY",
    controlName: "SETTINGS:SECURITY",
    recordId: "SECURITY",
    aliases: ["SECURITY"],
    description: "Manage two-factor auth and active sessions",
    allowedRoles: ["*"],
    actionType: "SETTINGS",
    settingsTabId: "security",
  },

  // 4. Quick System Action Commands
  {
    id: "ACTION:TOGGLE_THEME",
    title: "Toggle Dark / Light Theme",
    category: "Quick Actions",
    command: "ACTION:TOGGLE_THEME",
    controlName: "ACTION:TOGGLE_THEME",
    recordId: "DARK",
    aliases: ["DARK"],
    description: "Switch application theme mode",
    allowedRoles: ["*"],
    actionType: "THEME",
  },
  {
    id: "ACTION:LOGOUT",
    title: "Sign Out Session",
    category: "Quick Actions",
    command: "ACTION:LOGOUT",
    controlName: "ACTION:LOGOUT",
    recordId: "LOGOUT",
    aliases: ["LOGOUT", "EXIT"],
    description: "Terminate current active user session",
    allowedRoles: ["*"],
    actionType: "LOGOUT",
  },
];

/**
 * Returns all unique registered commands.
 */
export function getAllRegisteredCommands(): SystemCommandItem[] {
  return MASTER_COMMAND_DEFINITIONS;
}

import type { MenuItem } from "@/lib/schemas";

/**
 * Traverses menu hierarchy and extracts screen execution commands.
 */
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
