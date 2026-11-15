import type { ControlCommand } from "@/lib/data-schemas";

export interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  cmd: ControlCommand;
  category: string;
  onSelect: (cmd: ControlCommand) => void;
}
