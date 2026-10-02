"use client";

import { Copy, ExternalLink, X, XCircle, XSquare } from "lucide-react";
import type * as React from "react";
import { launchScreen } from "@/features/screens";
import type { WorkbenchTab } from "@/store";
import { useAlertStore, useWorkbenchStore } from "@/store";

export interface TabMenuActionProps {
  tab: WorkbenchTab;
  ItemComponent: React.ElementType;
  LabelComponent: React.ElementType;
  SeparatorComponent: React.ElementType;
  ShortcutComponent: React.ElementType;
}

export function TabMenuItems({
  tab,
  ItemComponent,
  LabelComponent,
  SeparatorComponent,
  ShortcutComponent,
}: TabMenuActionProps) {
  const { removeTab, addTab, duplicateTab, closeOthers, closeToRight, tabs } = useWorkbenchStore();
  const { confirm } = useAlertStore();

  const isLastTab = tabs.length <= 1;
  const isRightmost = tabs[tabs.length - 1]?.id === tab.id;

  const hasDirtyData = (t: WorkbenchTab) => {
    return (
      t.formData && Object.values(t.formData).some((v) => v !== undefined && v !== null && v !== "")
    );
  };

  const handleCloseTab = () => {
    if (hasDirtyData(tab)) {
      confirm({
        title: `Close "${tab.title}"?`,
        message: "You have unsaved typed inputs in this tab. Closing it will discard your changes.",
        variant: "destructive",
        confirmText: "Discard & Close",
        onConfirm: () => removeTab(tab.id),
      });
    } else {
      removeTab(tab.id);
    }
  };

  const handleCloseOthers = () => {
    const otherTabs = tabs.filter((t) => t.id !== tab.id);
    const dirtyOthers = otherTabs.filter(hasDirtyData);

    if (dirtyOthers.length > 0) {
      const titles = dirtyOthers.map((t) => `"${t.title}"`).join(", ");
      confirm({
        title: "Close other tabs?",
        message: `You have unsaved typed inputs in ${titles}. Closing them will discard your changes.`,
        variant: "destructive",
        confirmText: "Discard & Close Others",
        onConfirm: () => closeOthers(tab.id),
      });
    } else {
      closeOthers(tab.id);
    }
  };

  const handleCloseToRight = () => {
    const idx = tabs.findIndex((t) => t.id === tab.id);
    if (idx === -1) return;
    const rightTabs = tabs.slice(idx + 1);
    const dirtyRight = rightTabs.filter(hasDirtyData);

    if (dirtyRight.length > 0) {
      const titles = dirtyRight.map((t) => `"${t.title}"`).join(", ");
      confirm({
        title: "Close tabs to the right?",
        message: `You have unsaved typed inputs in ${titles}. Closing them will discard your changes.`,
        variant: "destructive",
        confirmText: "Discard & Close",
        onConfirm: () => closeToRight(tab.id),
      });
    } else {
      closeToRight(tab.id);
    }
  };

  const handlePopOut = () => {
    launchScreen({
      id: tab.screenId ?? tab.id,
      title: tab.title,
      componentName: tab.componentName,
      target: "popup",
      screenMode: tab.screenMode,
      searchRecordId: tab.searchRecordId,
      formData: tab.formData,
      addTab,
    });
    removeTab(tab.id);
  };

  const handleCopyScreenCode = () => {
    const code = tab.screenId ?? tab.componentName ?? tab.title;
    navigator.clipboard.writeText(code).catch(() => {});
  };

  return (
    <>
      <LabelComponent className="truncate text-xs font-semibold text-foreground">
        {tab.title}
      </LabelComponent>
      <SeparatorComponent />

      <ItemComponent
        onClick={() => duplicateTab(tab.id)}
        onSelect={() => duplicateTab(tab.id)}
        className="text-xs cursor-pointer gap-2"
      >
        <Copy className="size-3.5" />
        <span>Duplicate Tab</span>
        <ShortcutComponent className="text-[10px]">Ctrl+D</ShortcutComponent>
      </ItemComponent>

      <ItemComponent
        onClick={handlePopOut}
        onSelect={handlePopOut}
        className="text-xs cursor-pointer gap-2"
      >
        <ExternalLink className="size-3.5" />
        <span>Pop Out</span>
      </ItemComponent>

      <ItemComponent
        onClick={handleCopyScreenCode}
        onSelect={handleCopyScreenCode}
        className="text-xs cursor-pointer gap-2"
      >
        <Copy className="size-3.5" />
        <span>Copy Screen Code</span>
      </ItemComponent>

      <SeparatorComponent />

      <ItemComponent
        onClick={handleCloseTab}
        onSelect={handleCloseTab}
        variant="destructive"
        className="text-xs cursor-pointer gap-2"
      >
        <X className="size-3.5" />
        <span>Close Tab</span>
        <ShortcutComponent className="text-[10px]">Ctrl+W</ShortcutComponent>
      </ItemComponent>

      <ItemComponent
        onClick={handleCloseOthers}
        onSelect={handleCloseOthers}
        disabled={isLastTab}
        variant="destructive"
        className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
      >
        <XCircle className="size-3.5" />
        <span>Close Others</span>
      </ItemComponent>

      <ItemComponent
        onClick={handleCloseToRight}
        onSelect={handleCloseToRight}
        disabled={isRightmost}
        variant="destructive"
        className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
      >
        <XSquare className="size-3.5" />
        <span>Close to the Right</span>
      </ItemComponent>
    </>
  );
}
