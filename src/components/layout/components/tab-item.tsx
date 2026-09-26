"use client";

import { ExternalLink, X } from "lucide-react";
import type * as React from "react";
import { useAlertStore } from "@/components/providers/alert-provider";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";
import { Badge } from "@/components/ui/badge";
import { launchScreen } from "@/features/workspace";
import { cn } from "@/lib/utils";
import type { WorkbenchTab } from "@/store/workbench-store";

interface TabItemProps {
  tab: WorkbenchTab;
  index: number;
  isActive: boolean;
  hasMovedRef: React.RefObject<boolean>;
}

export function TabItem({ tab, index, isActive, hasMovedRef }: TabItemProps) {
  const { setActiveTab, removeTab, addTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();
  const universalTabNumber = index + 1;

  return (
    // biome-ignore lint/a11y/useSemanticElements: outer container is interactive tab item holding nested action buttons
    <div
      data-tab-id={tab.id}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (hasMovedRef.current) {
          e.preventDefault();
          return;
        }
        setActiveTab(tab.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveTab(tab.id);
        }
      }}
      className={cn(
        "group relative flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border whitespace-nowrap shrink-0 h-8 cursor-pointer select-none",
        isActive
          ? "bg-background text-foreground border-border shadow-2xs font-semibold"
          : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground",
      )}
    >
      {/* Subtle Tab Number & Title */}
      <span className="truncate max-w-[160px] text-xs flex items-center gap-1.5">
        <div className="relative flex items-center justify-center h-4 min-w-[16px]">
          <Badge
            variant="secondary"
            className="h-4 min-w-[16px] px-1 rounded-sm text-[10px] font-mono flex items-center justify-center opacity-70 border-transparent group-hover:opacity-0 transition-opacity"
          >
            {universalTabNumber}
          </Badge>
          {/* Pop Out Tab Button (Visible over tab number only on hover) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              launchScreen({
                id: tab.screenId ?? tab.id,
                title: tab.title,
                componentName: tab.componentName,
                target: "popup",
                addTab,
              });
              removeTab(tab.id);
            }}
            className="absolute inset-0 size-4 rounded-xs hidden group-hover:flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0 m-auto"
            title={`Pop out ${tab.title}`}
          >
            <ExternalLink className="size-3" />
          </button>
        </div>
        {tab.title}
      </span>

      {/* Tab Actions */}
      <div
        className={cn(
          "flex items-center gap-0.5",
          !isActive && "opacity-60 group-hover:opacity-100",
        )}
      >
        {/* Close Tab Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const hasUserInput =
              tab.formData &&
              Object.values(tab.formData).some(
                (v) => v !== undefined && v !== null && v !== "",
              );

            if (hasUserInput) {
              confirm({
                title: `Close "${tab.title}"?`,
                message:
                  "You have unsaved typed inputs in this tab. Closing it will discard your changes.",
                variant: "destructive",
                confirmText: "Discard & Close",
                onConfirm: () => removeTab(tab.id),
              });
            } else {
              removeTab(tab.id);
            }
          }}
          className="size-4 rounded-xs flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          aria-label={`Close tab ${tab.title}`}
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}
