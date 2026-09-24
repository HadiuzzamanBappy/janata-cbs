import {
  ICON_REGISTRY as CONFIG_ICON_REGISTRY,
  DEFAULT_STATIC_COMMANDS,
  type SystemCommandItem,
} from "@/lib/config/command-definitions";

export type {
  CommandActionType,
  SystemCommandItem,
} from "@/lib/config/command-definitions";

export interface CommandExecutionContext {
  addTab?: (tab: { id: string; title: string; componentName: string }) => void;
  openSettingsTab?: (tabId: string) => void;
  clearSession?: () => void;
}

export const ICON_REGISTRY = CONFIG_ICON_REGISTRY;

/**
 * MASTER SINGLE SOURCE OF TRUTH COMMAND MAP (Runtime Store)
 */
const MASTER_COMMAND_MAP = new Map<string, SystemCommandItem>();

// Initialize Master Map with config definitions
for (const cmd of DEFAULT_STATIC_COMMANDS) {
  MASTER_COMMAND_MAP.set(cmd.command.toUpperCase(), cmd);
}

/**
 * Register a command dynamically from anywhere in the application.
 */
export function registerCommand(item: SystemCommandItem): void {
  MASTER_COMMAND_MAP.set(item.command.toUpperCase(), item);
}

/**
 * Get all registered commands as an array.
 */
export function getAllRegisteredCommands(): SystemCommandItem[] {
  return Array.from(MASTER_COMMAND_MAP.values());
}

/**
 * Look up a registered command by command string.
 */
export function getRegisteredCommand(
  commandStr: string,
): SystemCommandItem | undefined {
  if (!commandStr) return undefined;
  return MASTER_COMMAND_MAP.get(commandStr.trim().toUpperCase());
}

/**
 * Central Command Dispatcher.
 * 1. Checks if command exists in single source of truth registry.
 * 2. If it's a SETTINGS modal action, opens App Settings Dialog.
 * 3. If it's a quick action (THEME, LOGOUT), executes action.
 * 4. If it's a SCREEN command (Bespoke or Dynamic API schema fallback), opens Workbench tab.
 */
export function dispatchCommand(
  commandStr: string,
  context: CommandExecutionContext,
  title?: string,
  componentName?: string,
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
  if (
    registered?.actionType === "THEME" ||
    cleanCmd === "action:toggle_theme"
  ) {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    return;
  }

  // 3. Logout Action
  if (registered?.actionType === "LOGOUT" || cleanCmd === "action:logout") {
    if (context.clearSession) {
      context.clearSession();
    }
    return;
  }

  // 4. Screen Command (Workspace Tab with Bespoke Component OR Dynamic API Schema Fallback)
  if (context.addTab) {
    context.addTab({
      id: cleanCmd,
      title: title || registered?.title || cleanCmd,
      componentName:
        componentName || registered?.componentName || "DYNAMIC_FORM",
    });
  }
}
