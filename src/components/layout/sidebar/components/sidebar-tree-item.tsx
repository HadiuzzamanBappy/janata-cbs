"use client";

import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cbsCommand } from "@/lib/cbs-command";
import { cn } from "@/lib/core-utils";
import { useWorkbenchStore } from "@/store";
import type { TreeNode } from "../types";
import { hasActiveChild, isCommandMatch } from "../utils";

export interface TreeItemProps {
  node: TreeNode;
  level?: number;
  openSettingsTab?: (tabId: string) => void;
  clearSession?: () => void;
}

export function SidebarTreeItem({ node, openSettingsTab, clearSession }: TreeItemProps) {
  const { tabs, activeTabId } = useWorkbenchStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const activeCommand = activeTab?.screenId || activeTab?.id;

  const isFolder = !node.command;
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isLeaf = !isFolder;

  // Check if this node or any child node is currently active
  const isChildActive = React.useMemo(
    () => hasActiveChild(node, activeCommand),
    [node, activeCommand],
  );

  const [isOpen, setIsOpen] = React.useState(isChildActive);

  // Automatically expand parent node when a child screen is launched (e.g. via Search)
  React.useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  const isActive = isLeaf && isCommandMatch(node.command ?? node.id, activeCommand);

  const handleClick = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (isFolder) {
      setIsOpen((prev) => !prev);
    } else if (node.command) {
      cbsCommand.execute(node.command, {
        title: node.title,
        target: node.menuAction === "POPUP" ? "popup" : "workspace",
      });
    }
  };

  const textRef = React.useRef<HTMLSpanElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [isOverflowed, setIsOverflowed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [popoutPos, setPopoutPos] = React.useState<{
    top: number;
    left: number;
    height: number;
  } | null>(null);

  const checkOverflow = () => {
    if (textRef.current) {
      const hasOverflow = textRef.current.scrollWidth > textRef.current.clientWidth;
      setIsOverflowed(hasOverflow);
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoutPos({
        top: rect.top,
        left: rect.left,
        height: rect.height,
      });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const shouldPopout = isOverflowed && isHovered && popoutPos !== null;

  return (
    <div className="flex flex-col select-none relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={checkOverflow}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e);
          }
        }}
        data-cbs-command={isLeaf ? (node.command ?? node.id) : undefined}
        data-cbs-label={node.title}
        data-cbs-link-handled="true"
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-[13px] font-normal cursor-pointer transition-all duration-150 ease-out group/item w-full text-left border-0 bg-transparent relative leading-snug",
          isActive
            ? "bg-accent/80 text-foreground font-medium shadow-2xs"
            : isChildActive
              ? "text-foreground font-normal hover:bg-accent/30"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        )}
      >
        {isFolder ? (
          <span className="size-4 flex items-center justify-center text-muted-foreground/80 group-hover/item:text-foreground shrink-0 transition-colors duration-150">
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )
            ) : (
              <ChevronRight className="size-4 opacity-40" />
            )}
          </span>
        ) : (
          <span className="size-4 flex items-center justify-center shrink-0 transition-colors duration-150 text-muted-foreground/70 group-hover/item:text-foreground">
            {node.menuType === "INQUIRY" ? (
              <Search className="size-3.5" />
            ) : node.menuType === "REPORT" ? (
              <BarChart3 className="size-3.5" />
            ) : node.menuType === "FORM" ? (
              <FileSpreadsheet className="size-3.5" />
            ) : (
              <FileText className="size-3.5" />
            )}
          </span>
        )}

        <span ref={textRef} className="flex-1 min-w-0 truncate">
          {node.title}
        </span>
      </button>

      {/* Floating Popout via Portal to completely bypass overflow/clipping containers */}
      {shouldPopout &&
        typeof document !== "undefined" &&
        createPortal(
          <button
            type="button"
            style={{
              position: "fixed",
              top: `${popoutPos.top}px`,
              left: `${popoutPos.left}px`,
              minHeight: `${popoutPos.height}px`,
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            data-cbs-command={isLeaf ? (node.command ?? node.id) : undefined}
            data-cbs-label={node.title}
            data-cbs-link-handled="true"
            className="z-5000 flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[13px] font-normal whitespace-nowrap bg-accent/95 backdrop-blur-md text-foreground shadow-xl ring-1 ring-border/80 cursor-pointer pointer-events-auto leading-snug animate-in fade-in-0 duration-100 border-0 text-left"
          >
            {isFolder ? (
              <span className="size-4 flex items-center justify-center text-muted-foreground/80 shrink-0">
                {hasChildren ? (
                  isOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )
                ) : (
                  <ChevronRight className="size-4 opacity-40" />
                )}
              </span>
            ) : (
              <span className="size-4 flex items-center justify-center shrink-0 text-foreground">
                {node.menuType === "INQUIRY" ? (
                  <Search className="size-3.5" />
                ) : node.menuType === "REPORT" ? (
                  <BarChart3 className="size-3.5" />
                ) : node.menuType === "FORM" ? (
                  <FileSpreadsheet className="size-3.5" />
                ) : (
                  <FileText className="size-3.5" />
                )}
              </span>
            )}
            <span>{node.title}</span>
          </button>,
          document.body,
        )}

      {/* Tree Indentation & Vertical Guide Connector Line */}
      {hasChildren && isOpen && (
        <div className="flex flex-col relative ml-1.5 pl-1.5 my-0.5 space-y-0.5">
          {/* Subtle Vertical Connector Guide Line */}
          <div className="absolute left-0 top-0 bottom-1 w-px bg-border/40" />

          {node.children?.map((child) => (
            <SidebarTreeItem
              key={child.id}
              node={child}
              openSettingsTab={openSettingsTab}
              clearSession={clearSession}
            />
          ))}
        </div>
      )}
    </div>
  );
}
