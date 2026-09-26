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
import { SecurityTab } from "@/features/settings";

export type CommandActionType = "SCREEN" | "SETTINGS" | "THEME" | "LOGOUT";

export interface SystemCommandItem {
  id: string;
  title: string;
  category: string;
  description: string;
  command: string;
  componentName?: string;
  allowedRoles: string[]; // "*" = all roles, "Administrator" = admin only
  icon?: React.ComponentType<{ className?: string }>;
  actionType: CommandActionType;
  component?: React.ComponentType<{ command: string }>;
  settingsTabId?: string;
}

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
 * MASTER STATIC COMMANDS CONFIGURATION

 * Maintain all static pre-registered application commands here.
 */
export const DEFAULT_STATIC_COMMANDS: SystemCommandItem[] = [
  // Bespoke React Screens
  {
    id: "user.change.pass",
    title: "Change Password",
    category: "Security & Authentication",
    description: "User change security password profile",
    command: "USER.CHANGE.PASS",
    componentName: "USER_CHANGE_PASS",
    allowedRoles: ["*"],
    icon: Lock,
    actionType: "SCREEN",
    component: SecurityTab,
  },

  // App Settings Modals
  {
    id: "settings:profile",
    title: "User Profile Settings",
    category: "System Settings Modal",
    description: "Open user profile modal dialog",
    command: "SETTINGS:PROFILE",
    allowedRoles: ["*"],
    icon: Settings,
    actionType: "SETTINGS",
    settingsTabId: "profile",
  },
  {
    id: "settings:security",
    title: "Security & Password Settings",
    category: "System Settings Modal",
    description: "Open security & password modal dialog",
    command: "SETTINGS:SECURITY",
    allowedRoles: ["*"],
    icon: Lock,
    actionType: "SETTINGS",
    settingsTabId: "security",
  },
  {
    id: "settings:appearance",
    title: "Appearance & Display Settings",
    category: "System Settings Modal",
    description: "Open appearance theme settings modal dialog",
    command: "SETTINGS:APPEARANCE",
    allowedRoles: ["*"],
    icon: Sun,
    actionType: "SETTINGS",
    settingsTabId: "appearance",
  },

  // Quick System Actions
  {
    id: "action:toggle_theme",
    title: "Toggle Light / Dark Theme",
    category: "Quick Actions",
    command: "ACTION:TOGGLE_THEME",
    description: "Switch application theme mode",
    allowedRoles: ["*"],
    icon: Sun,
    actionType: "THEME",
  },
  {
    id: "action:logout",
    title: "Sign Out Session",
    category: "Quick Actions",
    command: "ACTION:LOGOUT",
    description: "Terminate current active user session",
    allowedRoles: ["*"],
    icon: LogOut,
    actionType: "LOGOUT",
  },
];
