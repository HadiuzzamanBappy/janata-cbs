import type * as React from "react";

export type ScreenMode = "panel" | "window";

export interface ScreenProps {
  command: string;
  tabId?: string;
  className?: string;
}

export interface ScreenLoaderProps {
  command: string;
  tabId?: string;
  mode?: ScreenMode;
  className?: string;
}

export type ScreenComponent = React.ComponentType<ScreenProps>;

export interface RegisteredScreenItem {
  command: string;
  component: ScreenComponent;
  title?: string;
}
