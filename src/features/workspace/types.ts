export interface ComponentLoaderProps {
  command: string;
  mode?: "panel" | "window";
  className?: string;
}

export interface WorkspaceTabItem {
  id: string;
  title: string;
  command?: string;
  componentName?: string;
  closable?: boolean;
}
