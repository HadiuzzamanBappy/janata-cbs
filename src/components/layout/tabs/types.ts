import type * as React from "react";
import type { WorkbenchTab } from "@/store";

export interface TabItemProps {
  tab: WorkbenchTab;
  index: number;
  isActive: boolean;
  showSeparator?: boolean;
  isDraggingThis?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export interface TabMenuActionProps {
  tab: WorkbenchTab;
  GroupComponent?: React.ElementType;
  ItemComponent: React.ElementType;
  LabelComponent: React.ElementType;
  SeparatorComponent: React.ElementType;
  ShortcutComponent: React.ElementType;
}

export interface TabWindowMenuItemProps {
  tab: WorkbenchTab;
  originalIndex: number;
  isActive: boolean;
  isSearching: boolean;
  draggedMenuIndex: number | null;
  dragOverMenuIndex: number | null;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}
