import type { CbsScreenComponent, CbsScreenProps } from "@/lib/cbs-screen";

export type ScreenMode = "panel" | "window";

export type ScreenProps = CbsScreenProps;

export interface ScreenLoaderProps {
  command: string;
  tabId?: string;
  mode?: ScreenMode;
  className?: string;
}

export type ScreenComponent = CbsScreenComponent;

export interface RegisteredScreenItem {
  command: string;
  component: ScreenComponent;
  title?: string;
}
