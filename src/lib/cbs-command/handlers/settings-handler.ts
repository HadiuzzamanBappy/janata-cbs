import { resolveCommandAlias } from "../registry/alias";
import {
  CBS_SETTINGS_EVENT,
  CBS_SETTINGS_TABS,
  type CbsSettingsTabId,
  type CommandHandler,
  type ExecutionOptions,
  type ParsedCommand,
} from "../types";

export class SettingsCommandHandler implements CommandHandler {
  readonly type = "SETTINGS" as const;

  canHandle(_raw: string, upper: string): boolean {
    const resolved = resolveCommandAlias(upper);
    return resolved.startsWith("SETTINGS:");
  }

  parse(raw: string, upper: string): ParsedCommand {
    const resolved = resolveCommandAlias(upper);
    const rawTab = resolved.startsWith("SETTINGS:")
      ? resolved.slice("SETTINGS:".length).trim().toLowerCase()
      : "";

    const settingsTab = CBS_SETTINGS_TABS.includes(rawTab as CbsSettingsTabId)
      ? (rawTab as CbsSettingsTabId)
      : undefined;

    if (!settingsTab) {
      return {
        raw,
        isValid: false,
        error: `Unknown settings tab "${rawTab}". Valid options: ${CBS_SETTINGS_TABS.join(", ")}`,
        type: "SETTINGS",
        application: "SETTINGS",
        title: "Settings",
        authLevel: 1,
        screenMode: "IDLE",
        params: {},
      };
    }

    return {
      raw,
      isValid: true,
      type: "SETTINGS",
      application: "SETTINGS",
      title: `${settingsTab.toUpperCase()} Settings`,
      target: settingsTab,
      authLevel: 1,
      screenMode: "IDLE",
      params: { tab: settingsTab },
    };
  }

  execute(command: ParsedCommand, _options?: ExecutionOptions): boolean {
    const tab = command.target;
    if (tab && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(CBS_SETTINGS_EVENT, {
          detail: { tab },
        }),
      );
      return true;
    }
    return false;
  }
}
