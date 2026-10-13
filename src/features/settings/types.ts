export type SettingsTabId = "profile" | "security" | "appearance" | "deactivate";

export interface SettingsTabItem {
  id: SettingsTabId;
  name: string;
}

export interface AppSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab?: SettingsTabId | string;
  onTabChange?: (tab: SettingsTabId) => void;
}
