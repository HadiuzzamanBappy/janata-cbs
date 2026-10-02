import {
  BadgeAlert,
  Building2,
  Database,
  FileText,
  Lock,
  LogOut,
  Search,
  SendHorizontal,
  Settings,
  Sliders,
  Sun,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type * as React from "react";
import type { CommandActionType, SystemCommandItem } from "@/lib/schemas";

export type { CommandActionType, SystemCommandItem };

export const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  UserCheck,
  UserPlus,
  Users,
  Building2,
  FileText,
  Search,
  Settings,
  Sliders,
  Database,
  Lock,
  LogOut,
  Sun,
  SendHorizontal,
  BadgeAlert,
};

/**
 * MASTER STATIC COMMANDS
 * Default application commands for navigation, settings, and quick actions.
 */
export const DEFAULT_STATIC_COMMANDS: SystemCommandItem[] = [
  // Bespoke React Screens
  {
    id: "USER.CHANGE.PASS",
    title: "Change Password",
    category: "Security & Authentication",
    description: "User change security password profile",
    command: "USER.CHANGE.PASS",
    controlName: "USER.CHANGE.PASS",
    recordId: "PASS",
    aliases: ["PASS", "PWD"],
    componentName: "USER_CHANGE_PASS",
    allowedRoles: ["*"],
    actionType: "SCREEN",
  },

  // App Settings Modals
  {
    id: "SETTINGS:PROFILE",
    title: "User Profile Settings",
    category: "System Settings Modal",
    description: "Open user profile modal dialog",
    command: "SETTINGS:PROFILE",
    controlName: "SETTINGS:PROFILE",
    recordId: "PROFILE",
    aliases: ["PROFILE"],
    allowedRoles: ["*"],
    actionType: "SETTINGS",
    settingsTabId: "profile",
  },
  {
    id: "SETTINGS:SECURITY",
    title: "Security & Password Settings",
    category: "System Settings Modal",
    description: "Open security & password modal dialog",
    command: "SETTINGS:SECURITY",
    controlName: "SETTINGS:SECURITY",
    recordId: "SECURITY",
    aliases: ["SECURITY"],
    allowedRoles: ["*"],
    actionType: "SETTINGS",
    settingsTabId: "security",
  },
  {
    id: "SETTINGS:APPEARANCE",
    title: "Appearance & Display Settings",
    category: "System Settings Modal",
    description: "Open appearance theme settings modal dialog",
    command: "SETTINGS:APPEARANCE",
    controlName: "SETTINGS:APPEARANCE",
    recordId: "THEME",
    aliases: ["THEME"],
    allowedRoles: ["*"],
    actionType: "SETTINGS",
    settingsTabId: "appearance",
  },

  // Quick System Actions
  {
    id: "ACTION:TOGGLE_THEME",
    title: "Toggle Light / Dark Theme",
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

export interface CommandExecutionContext {
  addTab?: (tab: {
    id: string;
    title: string;
    componentName: string;
    screenMode?: "IDLE" | "CREATE" | "EDIT" | "VIEW";
    searchRecordId?: string;
  }) => void;
  openSettingsTab?: (tabId: string) => void;
  clearSession?: () => void;
  toggleTheme?: () => void;
  confirmAlert?: (options: {
    title: string;
    message: string;
    variant?: "destructive" | "default";
    confirmText?: string;
    onConfirm: () => void;
  }) => void;
}

/**
 * MASTER SINGLE SOURCE OF TRUTH COMMAND MAP (Runtime Store)
 */
const MASTER_COMMAND_MAP = new Map<string, SystemCommandItem>();
const UNIQUE_COMMAND_LIST = new Set<SystemCommandItem>();

/**
 * Register a command and automatically bind all its shorthand aliases.
 */
export function registerCommand(item: SystemCommandItem): void {
  UNIQUE_COMMAND_LIST.add(item);
  MASTER_COMMAND_MAP.set(item.command.toUpperCase(), item);

  if (item.aliases && item.aliases.length > 0) {
    for (const alias of item.aliases) {
      MASTER_COMMAND_MAP.set(alias.toUpperCase(), item);
    }
  }
}

// Initialize Master Map with default static commands
for (const cmd of DEFAULT_STATIC_COMMANDS) {
  registerCommand(cmd);
}

/**
 * Get all unique registered commands.
 */
export function getAllRegisteredCommands(): SystemCommandItem[] {
  return Array.from(UNIQUE_COMMAND_LIST);
}

/**
 * Look up a registered command by command string.
 */
export function getRegisteredCommand(commandStr: string): SystemCommandItem | undefined {
  if (!commandStr) return undefined;
  return MASTER_COMMAND_MAP.get(commandStr.trim().toUpperCase());
}

/**
 * Central Command Dispatcher.
 */
export function dispatchCommand(
  commandStr: string,
  context: CommandExecutionContext,
  title?: string,
  componentName?: string,
  screenMode?: "IDLE" | "CREATE" | "EDIT" | "VIEW",
  searchRecordId?: string,
): void {
  if (!commandStr) return;

  const cleanCmd = commandStr.trim();
  const registered = getRegisteredCommand(cleanCmd);

  // 1. Settings Dialog Modal Route
  if (
    registered?.actionType === "SETTINGS" ||
    cleanCmd.toLowerCase().startsWith("settings:") ||
    cleanCmd.toLowerCase().startsWith("setting>")
  ) {
    const tabId =
      registered?.settingsTabId ||
      cleanCmd.toLowerCase().replace(/^(settings:|setting>)/, "") ||
      "profile";
    if (context.openSettingsTab) {
      context.openSettingsTab(tabId);
    }
    return;
  }

  // 2. Theme Toggle Action
  if (registered?.actionType === "THEME" || cleanCmd === "action:toggle_theme") {
    if (context.toggleTheme) {
      context.toggleTheme();
    } else if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
    return;
  }

  // 3. Logout Action
  if (registered?.actionType === "LOGOUT" || cleanCmd === "action:logout") {
    if (context.clearSession) {
      if (context.confirmAlert) {
        context.confirmAlert({
          title: "Sign Out Confirmation",
          message:
            "Are you sure you want to terminate your current active session? Any unsaved form progress will be lost.",
          variant: "destructive",
          confirmText: "Sign Out",
          onConfirm: () => context.clearSession?.(),
        });
      } else {
        context.clearSession();
      }
    }
    return;
  }

  // 4. Screen Command (Workspace Tab with Bespoke Component OR Dynamic API Schema Fallback)
  if (context.addTab) {
    context.addTab({
      id: cleanCmd,
      title: title || registered?.title || cleanCmd,
      componentName: componentName || registered?.componentName || "DYNAMIC_FORM",
      screenMode,
      searchRecordId,
    });
  }
}
