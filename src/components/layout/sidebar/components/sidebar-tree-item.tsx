"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cbsCommand } from "@/lib/cbs-command";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store";
import { hasActiveChild, type TreeNode } from "../types";

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

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isLeaf = !hasChildren;

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

  const isActive =
    isLeaf &&
    (activeCommand === (node.command ?? node.id) ||
      activeCommand?.toUpperCase() === (node.command ?? node.id).toUpperCase());

  const handleClick = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    } else {
      cbsCommand.execute(node.command ?? node.id, {
        title: node.title,
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
        className={cn(
          "flex items-center gap-1 px-1.5 py-1.5 rounded text-xs font-normal cursor-pointer transition-all duration-150 ease-out group w-full text-left border-0 bg-transparent relative leading-snug",
          isActive
            ? "bg-accent/80 text-foreground font-medium shadow-2xs"
            : isChildActive
              ? "text-foreground font-normal hover:bg-accent/30"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        )}
      >
        {hasChildren ? (
          <span className="size-3.5 flex items-center justify-center text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors duration-200">
            {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
        ) : (
          <span className="size-3.5 flex items-center justify-center text-muted-foreground/50 group-hover:text-foreground shrink-0 transition-colors duration-200">
            <span className="size-1 rounded-full bg-current opacity-70" />
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
            className="z-5000 flex items-center gap-1 px-2 py-1.5 rounded text-xs font-normal whitespace-nowrap bg-accent/95 backdrop-blur-md text-foreground shadow-xl ring-1 ring-border/80 cursor-pointer pointer-events-auto leading-snug animate-in fade-in-0 duration-100 border-0 text-left"
          >
            {hasChildren ? (
              <span className="size-3.5 flex items-center justify-center text-muted-foreground/80 shrink-0">
                {isOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </span>
            ) : (
              <span className="size-3.5 flex items-center justify-center text-muted-foreground/50 shrink-0">
                <span className="size-1 rounded-full bg-current opacity-70" />
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
