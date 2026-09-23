export type SettingsTabId = "profile" | "security" | "appearance";

export interface SettingsTabItem {
  id: SettingsTabId;
  name: string;
}
