export type SettingsTabId = "profile" | "security" | "appearance" | "deactivate";

export interface SettingsTabItem {
  id: SettingsTabId;
  name: string;
}
