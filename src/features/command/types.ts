import type { SystemCommandItem } from "@/lib/schemas";

export interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openSettingsTab?: (tabId: string) => void;
}

export interface CommandGuideInfo {
  appName: string;
  typedFn: string;
  typedRecordId: string;
}

export interface RidashOption {
  code: string;
  label: string;
  right: boolean;
}

export interface CommandItemRowProps {
  cmd: SystemCommandItem;
  category: string;
  onSelect: (cmd: SystemCommandItem) => void;
}
