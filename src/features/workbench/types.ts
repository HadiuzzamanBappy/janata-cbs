import type { CbsScreenComponent, CbsScreenProps } from "@/lib/cbs-screen";

import type { WorkspaceDisplayMode } from "@/types";

export type { WorkspaceDisplayMode };
export type ScreenMode = WorkspaceDisplayMode;

export type ScreenProps = CbsScreenProps;

export interface ScreenLoaderProps {
  command: string;
  tabId?: string;
  mode?: WorkspaceDisplayMode;
  className?: string;
}

export type ScreenComponent = CbsScreenComponent;

export interface RegisteredScreenItem {
  command: string;
  component: ScreenComponent;
  title?: string;
}
