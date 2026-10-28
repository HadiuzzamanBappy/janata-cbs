import type { WorkspaceDisplayMode } from "@/types";

export interface ScreenLoaderProps {
  command: string;
  tabId?: string;
  mode?: WorkspaceDisplayMode;
  className?: string;
}
